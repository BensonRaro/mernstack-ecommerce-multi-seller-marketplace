export { inngest } from "./client.js";
import {
  sendProductRejected,
  sendProductApproved,
  sendOrderStatus,
  sendSellerApproved,
  sendSellerRejected,
  sendUserBanned,
  generateProductRecommendationsFn,
  generateFeedbackSummaryFn,
} from "./functions.js";

export const functions = [
  sendProductRejected,
  sendProductApproved,
  sendOrderStatus,
  sendSellerApproved,
  sendSellerRejected,
  sendUserBanned,
  generateProductRecommendationsFn,
  generateFeedbackSummaryFn,
];
