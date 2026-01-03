import type { Handle } from "@sveltejs/kit";

/**
 * Server hook that runs on every request
 * Validates session and populates event.locals.user
 */
export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get("session");

  if (sessionToken) {
    try {
      // Use Vite proxy in development, relative path in production
      const response = await fetch("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: `session=${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        event.locals.user = data.user;
      }
    } catch (error) {
      // Silent fail - user remains null
    }
  }

  // Protect dashboard routes
  if (event.url.pathname.startsWith("/dashboard") && !event.locals.user) {
    return new Response(null, {
      status: 302,
      headers: { location: "/login" },
    });
  }

  return resolve(event);
};
