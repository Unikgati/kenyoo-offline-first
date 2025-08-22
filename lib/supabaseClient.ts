import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// =================================================================================
// IMPORTANT: CONFIGURE YOUR SUPABASE CREDENTIALS
// =================================================================================
// You can find these in your Supabase project dashboard under Settings > API.
//
// 1. Replace 'https://YOUR_PROJECT_ID.supabase.co' with your Supabase Project URL.
// 2. Replace 'YOUR_SUPABASE_ANON_KEY' with your Supabase "anon" public key.
//
const supabaseUrl = 'https://efofkfpeormutvaqzfym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmb2ZrZnBlb3JtdXR2YXF6ZnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjkxNzMsImV4cCI6MjA3MTMwNTE3M30.b1g5K9Yvn7pdW40f-Menk8oVrd9pOGhey60y1z-oDDQ';
// =================================================================================

if (supabaseUrl.includes('YOUR_PROJECT_ID') || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
  const errorMessage = `Supabase credentials are not configured. 
  
Please open the file 'lib/supabaseClient.ts' and replace the placeholder values for 'supabaseUrl' and 'supabaseAnonKey' with the credentials from your Supabase project.`;
  
  // Display a user-friendly error on the page
  const root = document.getElementById('root');
  if (root) {
      root.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #fff2f2; color: #b91c1c; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; box-sizing: border-box;">
          <h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Configuration Error</h1>
          <pre style="margin-top: 1rem; padding: 1.5rem; background-color: #fee2e2; border-radius: 0.5rem; white-space: pre-wrap; word-wrap: break-word; text-align: left; font-family: monospace; line-height: 1.5;">${errorMessage}</pre>
          <p style="margin-top: 2rem; font-size: 0.9rem;">You can find these details in your Supabase project dashboard under <strong style="font-weight: bold;">Settings > API</strong>.</p>
        </div>
      `;
  }

  // Also throw an error to stop script execution
  throw new Error(errorMessage);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);