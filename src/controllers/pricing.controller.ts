import { Request, Response } from 'express';
import PricingPlan from '../models/PricingPlan';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendBadRequest,
} from '../utils/helper';
import logger from '../utils/logger';

// @desc    Get all active pricing plans (Public)
// @route   GET /api/pricing
// @access  Public
export const getActivePlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort({ priceInr: 1 });
    sendSuccess(res, plans, 'Active pricing plans fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching pricing plans:', error);
    sendError(res, 'Failed to fetch pricing plans', 500, 'FETCH_PLANS_ERROR', error.message);
  }
};

// @desc    Get all pricing plans including inactive (Admin)
// @route   GET /api/pricing/admin
// @access  Private/Admin
export const getAllPlansAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await PricingPlan.find().sort({ priceInr: 1 });
    sendSuccess(res, plans, 'All pricing plans fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching all pricing plans:', error);
    sendError(res, 'Failed to fetch all pricing plans', 500, 'FETCH_ALL_PLANS_ERROR', error.message);
  }
};

// @desc    Create a new pricing plan (Admin)
// @route   POST /api/pricing
// @access  Private/Admin
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, priceInr, durationDays, features, isActive } = req.body;

    if (!name || !description || priceInr === undefined || !durationDays) {
      sendBadRequest(res, 'Please provide all required fields (name, description, priceInr, durationDays)');
      return;
    }

    const plan = new PricingPlan({
      name,
      description,
      priceInr,
      durationDays,
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    const createdPlan = await plan.save();
    sendCreated(res, createdPlan, 'Pricing plan created successfully');
  } catch (error: any) {
    logger.error('Error creating pricing plan:', error);
    sendError(res, 'Failed to create pricing plan', 500, 'CREATE_PLAN_ERROR', error.message);
  }
};

// @desc    Update a pricing plan (Admin)
// @route   PUT /api/pricing/:id
// @access  Private/Admin
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, priceInr, durationDays, features, isActive } = req.body;

    const plan = await PricingPlan.findById(id);

    if (!plan) {
      sendNotFound(res, 'Pricing plan not found');
      return;
    }

    if (name) plan.name = name;
    if (description) plan.description = description;
    if (priceInr !== undefined) plan.priceInr = priceInr;
    if (durationDays !== undefined) plan.durationDays = durationDays;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    const updatedPlan = await plan.save();
    sendSuccess(res, updatedPlan, 'Pricing plan updated successfully');
  } catch (error: any) {
    logger.error('Error updating pricing plan:', error);
    sendError(res, 'Failed to update pricing plan', 500, 'UPDATE_PLAN_ERROR', error.message);
  }
};

// @desc    Delete a pricing plan (Admin)
// @route   DELETE /api/pricing/:id
// @access  Private/Admin
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await PricingPlan.findById(id);

    if (!plan) {
      sendNotFound(res, 'Pricing plan not found');
      return;
    }

    await plan.deleteOne();
    sendSuccess(res, null, 'Pricing plan deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting pricing plan:', error);
    sendError(res, 'Failed to delete pricing plan', 500, 'DELETE_PLAN_ERROR', error.message);
  }
};
