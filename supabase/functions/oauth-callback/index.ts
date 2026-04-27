// This function is deprecated - Gmail OAuth is handled by Supabase Auth directly.
// We no longer support Slack integration.
// Keeping this file empty for reference purposes.

export const handler = async () => {
  return new Response('Gmail OAuth uses Supabase Auth. This endpoint is deprecated.', {
    status: 200,
  });
};
