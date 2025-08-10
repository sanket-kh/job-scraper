import { supabase } from './supabaseClient'

// Upsert user profile after login
export async function upsertUserProfile(user) {
  const { data, error } = await supabase
    .from('userprofile')
    .upsert([
      {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email,
      }
    ], { onConflict: ['id'] })
    .select()
  if (error) throw error
  return data[0]
}

// Fetch user profile (including subscription status)
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('userprofile')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Update user subscription plan details
export async function updateUserSubscription(userId, { is_subscribed, plan_start_date, plan_end_date }) {
  const { data, error } = await supabase
    .from('userprofile')
    .update({
      is_subscribed,
      plan_start_date,
      plan_end_date,
    })
    .eq('id', userId)
    .select();
  if (error) throw error;
  return data[0];
}
