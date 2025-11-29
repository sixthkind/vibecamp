// middleware/auth.ts

import { pb } from "#imports";
import { initializeOutpostContext, getUserOutposts } from "~/utils/permissions";

/* 
This middleware checks auth, verification status, and outpost membership
If the user is not authenticated, only pages allowed are auth (signin) and auth/reset (forgot password)
If the user is authenticated and not verified, only page allowed is auth/verify
If the user has no outposts, redirect to outpost creation page
*/

export default defineNuxtRouteMiddleware(async (to, from) => {
  const requireVerified = false;
  const isAuthenticated = pb.authStore.isValid;

  // Set to true to bypass check.
  const isVerified = pb.authStore.record?.verified;
  const isOnboarded = true;
  const isApproved = true;

  // account for possible extra backslash at end of routes
  const authPathRegex = /^\/auth\/?$/;
  const resetPathRegex = /^\/auth\/reset\/?$/;
  const verifyPathRegex = /^\/auth\/verify\/?$/;
  const onboardPathRegex = /^\/auth\/onboard\/?$/;
  const completedPathRegex = /^\/auth\/completed\/?$/;
  const pendingPathRegex = /^\/auth\/pending\/?$/;
  const outpostsPathRegex = /^\/(?:create|outposts)\/?.*$/;

  // Handle unauthenticated users
  if (!isAuthenticated) {
    // allow /auth and /auth/reset
    if (!authPathRegex.test(to.path) && !resetPathRegex.test(to.path)) {
      return navigateTo('/auth');
    } else {
      return;
    }
  }

  // Handle authenticated users that navigate to the auth page
  if (authPathRegex.test(to.path)) {
    return navigateTo('/');
  }

  // Handle unverified users
  if (!isVerified && requireVerified) {
    if (!verifyPathRegex.test(to.path)) {
      return navigateTo('/auth/verify');
    } else {
      return;
    }
  }

  // Handle verified users that navigate to the verify page
  if (isVerified || !requireVerified) {
    if (verifyPathRegex.test(to.path)) {
      return navigateTo('/');
    }
  }

  // Handle non-onboarded users
  if (!isOnboarded) {
    if (!onboardPathRegex.test(to.path) && !completedPathRegex.test(to.path)) {
      return navigateTo('/auth/onboard');
    } else {
      return;
    }
  }

  // Handle onboarded users that navigate to the onboard page
  if (isOnboarded) {
    if (onboardPathRegex.test(to.path)) {
      return navigateTo('/');
    }
  }

  // Handle unapproved users
  if (!isApproved) {
    if (!pendingPathRegex.test(to.path)) {
      return navigateTo('/auth/pending');
    } else {
      return;
    }
  }

  // Handle approved users that navigate to the pending page
  if (isApproved) {
    if (pendingPathRegex.test(to.path)) {
      return navigateTo('/');
    }
  }

  // Check outpost membership - users must belong to at least one outpost
  // Skip this check for outpost management pages themselves
  if (!outpostsPathRegex.test(to.path)) {
    try {
      const outpostId = await initializeOutpostContext();
      
      if (!outpostId) {
        // User has no outposts, redirect to create one
        return navigateTo('/create');
      }
    } catch (error) {
      console.error('Error initializing outpost context:', error);
      // On error, redirect to outposts page to let user choose/create
      return navigateTo('/');
    }
  }
});