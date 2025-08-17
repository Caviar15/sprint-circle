import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  email: string
  boardId: string
  token: string
  role: string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, boardId, token, role }: InvitationRequest = await req.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get board information
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('name, owner_id')
      .eq('id', boardId)
      .single()

    if (boardError || !board) {
      throw new Error('Board not found')
    }

    // Get inviter information
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', board.owner_id)
      .single()

    if (inviterError) {
      console.warn('Could not fetch inviter info:', inviterError)
    }

    // Create invitation link
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://your-app.vercel.app'}/invite/${token}`

    console.log(`Connection request created for ${email}`)
    console.log(`Invitation URL: ${inviteUrl}`)
    console.log(`Inviter: ${inviter?.name || 'Unknown'}`)

    // For now, we'll just log the invitation details
    // In a real implementation, you would integrate with an email service like Resend
    // Example with Resend (commented out):
    /*
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    
    const { error: emailError } = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: [email],
      subject: `You're invited to join "${board.name}"`,
      html: `
        <h2>You've been invited to collaborate!</h2>
        <p>${inviter?.name || 'Someone'} has invited you to join the board "${board.name}" as a ${role}.</p>
        <p><a href="${inviteUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or copy this link: ${inviteUrl}</p>
      `
    })
    
    if (emailError) throw emailError
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation logged successfully',
        inviteUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Error in send-invitation function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}

serve(handler)