
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { user_id, permissions } = await req.json();

    if (!user_id || !permissions) {
      return new Response(
        JSON.stringify({ error: "User ID and permissions are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminCheck?.is_admin && user.email !== "alliahalexis.cinco@neu.edu.ph") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map permissions to user_permissions table format
    const permissionData = {
      user_id: user_id,
      edit_sales: permissions.editSales,
      add_sales: permissions.addSale,
      delete_sales: permissions.deleteSale,
      edit_sales_detail: permissions.editSalesDetail,
      add_sales_detail: permissions.addSalesDetail,
      delete_sales_detail: permissions.deleteSalesDetail
    };

    // Update user_permissions table first, using upsert to handle new or existing records
    const { error: permissionError } = await supabaseAdmin
      .from("user_permissions")
      .upsert(permissionData, { 
        onConflict: 'user_id' 
      });

    if (permissionError) {
      return new Response(
        JSON.stringify({ error: `Error updating permissions: ${permissionError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the profile with permissions, bypassing RLS
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Profile updated successfully", data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
