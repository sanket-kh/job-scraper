# Stripe backend for job-portal-application

## Setup

1. Install dependencies:

   cd stripe-backend
   npm install

2. Set your Stripe secret key in `.env` (already set for you):

   STRIPE_SECRET_KEY=sk_test_... (your key)
   PORT=4242

3. Start the backend server:

   npm start

The backend will run on http://localhost:4242

## Usage

- Frontend should POST to http://localhost:4242/create-checkout-session with `{ priceId }` in the body.
- The backend will return `{ url }` for Stripe Checkout redirect.
