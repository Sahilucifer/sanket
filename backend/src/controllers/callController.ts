import { Request, Response } from 'express';
import Joi from 'joi';
import { callService } from '../services/callService';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';
import { ApiResponse, CallResult } from '../types';
import { supabase } from '../config/database';
import { twilioService } from '../services/twilioService';

// Validation schemas
const initiateCallSchema = Joi.object({
  vehicleId: Joi.string().uuid().required(),
  callerNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
});

export class CallController {
  /**
   * Initiate a masked call between caller and vehicle owner
   * POST /api/call/initiate
   */
  async initiateCall(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = initiateCallSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            message: error.details?.[0]?.message || 'Validation error',
            code: 'VALIDATION_ERROR'
          }
        } as ApiResponse);
        return;
      }

      const { vehicleId, callerNumber } = value;

      logger.info('Call initiation request received', {
        vehicleId,
        callerNumber: callController.maskPhoneNumber(callerNumber),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get vehicle and owner information
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Vehicle not found',
            code: 'VEHICLE_NOT_FOUND'
          }
        } as ApiResponse);
        return;
      }

      // Get owner phone number
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('phone')
        .eq('id', vehicle.userId)
        .single();

      if (userError || !user) {
        logger.error('Failed to get vehicle owner information', {
          vehicleId,
          error: userError
        });
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to retrieve vehicle owner information',
            code: 'OWNER_LOOKUP_FAILED'
          }
        } as ApiResponse);
        return;
      }

      const ownerNumber = user.phone;

      // Generate status callback URL
      const statusCallback = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/call/webhook/exotel`;

      // Initiate masked call using call service
      const callResult = await callService.initiateMaskedCall(
        callerNumber,
        ownerNumber,
        statusCallback
      );

      // Log the call attempt in database
      const callLogData = {
        vehicle_id: vehicleId,
        caller_number: callerNumber,
        owner_number: ownerNumber,
        call_sid: callResult.callId || null,
        status: callResult.status,
        started_at: callResult.status === 'initiated' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      };

      const { error: logError } = await supabase
        .from('call_logs')
        .insert([callLogData]);

      if (logError) {
        logger.error('Failed to log call attempt', {
          vehicleId,
          callId: callResult.callId,
          error: logError
        });
        // Don't fail the request if logging fails
      }

      if (callResult.status === 'initiated') {
        logger.info('Call initiated successfully', {
          vehicleId,
          callId: callResult.callId,
          caller: callController.maskPhoneNumber(callerNumber),
          owner: callController.maskPhoneNumber(ownerNumber)
        });

        res.status(200).json({
          success: true,
          data: {
            callId: callResult.callId,
            status: callResult.status,
            message: callResult.message
          }
        } as ApiResponse<CallResult>);
      } else {
        logger.warn('Call initiation failed', {
          vehicleId,
          caller: callController.maskPhoneNumber(callerNumber),
          message: callResult.message
        });

        res.status(400).json({
          success: false,
          error: {
            message: callResult.message,
            code: 'CALL_INITIATION_FAILED'
          }
        } as ApiResponse);
      }

    } catch (error: any) {
      logger.error('Error in call initiation', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during call initiation',
          code: 'INTERNAL_ERROR'
        }
      } as ApiResponse);
    }
  }

  /**
   * Handle Exotel webhook for call status updates
   * POST /api/call/webhook/exotel
   */
  async handleExotelWebhook(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Exotel webhook received', {
        body: req.body,
        headers: req.headers
      });

      // Parse webhook data
      const webhookData = callService.parseWebhookData('exotel', req.body);
      if (!webhookData) {
        logger.error('Failed to parse Exotel webhook data', { body: req.body });
        res.status(400).json({ error: 'Invalid webhook data' });
        return;
      }

      // Update call log in database
      const updateData: any = {
        status: webhookData.CallStatus.toLowerCase(),
        updated_at: new Date().toISOString()
      };

      if (webhookData.CallDuration) {
        updateData.duration = parseInt(webhookData.CallDuration);
      }

      if (webhookData.EndTime) {
        updateData.ended_at = new Date(webhookData.EndTime).toISOString();
      }

      const { error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('call_sid', webhookData.CallSid);

      if (error) {
        logger.error('Failed to update call log from webhook', {
          callSid: webhookData.CallSid,
          error
        });
      } else {
        logger.info('Call log updated from webhook', {
          callSid: webhookData.CallSid,
          status: webhookData.CallStatus,
          duration: webhookData.CallDuration
        });
      }

      res.status(200).json({ success: true });

    } catch (error: any) {
      logger.error('Error handling Exotel webhook', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle Twilio webhook for call status updates
   * POST /api/call/webhook/twilio
   */
  async handleTwilioWebhook(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Twilio webhook received', {
        body: req.body,
        headers: req.headers
      });

      // Validate webhook signature if configured
      const signature = req.get('X-Twilio-Signature');
      if (signature && process.env.TWILIO_AUTH_TOKEN) {
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const payload = JSON.stringify(req.body);
        
        const isValid = callService.validateWebhookSignature('twilio', payload, signature, url);
        if (!isValid) {
          logger.warn('Invalid Twilio webhook signature');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

      // Parse webhook data
      const webhookData = callService.parseWebhookData('twilio', req.body);
      if (!webhookData) {
        logger.error('Failed to parse Twilio webhook data', { body: req.body });
        res.status(400).json({ error: 'Invalid webhook data' });
        return;
      }

      // Update call log in database
      const updateData: any = {
        status: webhookData.CallStatus.toLowerCase(),
        updated_at: new Date().toISOString()
      };

      if (webhookData.CallDuration) {
        updateData.duration = parseInt(webhookData.CallDuration);
      }

      if (webhookData.EndTime) {
        updateData.ended_at = new Date(webhookData.EndTime).toISOString();
      }

      const { error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('call_sid', webhookData.CallSid);

      if (error) {
        logger.error('Failed to update call log from webhook', {
          callSid: webhookData.CallSid,
          error
        });
      } else {
        logger.info('Call log updated from webhook', {
          callSid: webhookData.CallSid,
          status: webhookData.CallStatus,
          duration: webhookData.CallDuration
        });
      }

      res.status(200).json({ success: true });

    } catch (error: any) {
      logger.error('Error handling Twilio webhook', {
        error: error.message,
        body: req.body
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate TwiML for Twilio masked calling
   * POST /api/call/twilio/twiml
   */
  async generateTwiML(req: Request, res: Response): Promise<void> {
    try {
      const { to } = req.query;
      
      if (!to || typeof to !== 'string') {
        res.status(400).send('Missing or invalid "to" parameter');
        return;
      }

      logger.info('Generating TwiML for masked call', {
        to: callController.maskPhoneNumber(to)
      });

      const twiml = twilioService.generateTwiML(to);
      
      res.set('Content-Type', 'text/xml');
      res.status(200).send(twiml);

    } catch (error: any) {
      logger.error('Error generating TwiML', {
        error: error.message,
        query: req.query
      });
      res.status(500).send('Internal server error');
    }
  }

  /**
   * Get call logs for a specific vehicle (protected endpoint)
   * GET /api/call/logs/:vehicleId
   */
  async getCallLogs(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = (req as any).user?.id;

      if (!vehicleId || Array.isArray(vehicleId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Vehicle ID is required',
            code: 'MISSING_VEHICLE_ID'
          }
        } as ApiResponse);
        return;
      }

      // Verify vehicle ownership
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      if (!vehicle || vehicle.userId !== userId) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Vehicle not found or access denied',
            code: 'VEHICLE_NOT_FOUND'
          }
        } as ApiResponse);
        return;
      }

      // Get call logs (without exposing phone numbers)
      const { data: callLogs, error } = await supabase
        .from('call_logs')
        .select(`
          id,
          call_sid,
          status,
          duration,
          started_at,
          ended_at,
          created_at
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch call logs', {
          vehicleId,
          userId,
          error
        });
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch call logs',
            code: 'DATABASE_ERROR'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: callLogs
      } as ApiResponse);

    } catch (error: any) {
      logger.error('Error fetching call logs', {
        error: error.message,
        vehicleId: req.params.vehicleId
      });

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      } as ApiResponse);
    }
  }

  /**
   * Mask phone number for logging (show only last 4 digits)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }
}

export const callController = new CallController();