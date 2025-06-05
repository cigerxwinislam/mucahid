import { getServerUser } from '@/lib/server/server-chat-helpers';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

if (
  !process.env.NEXT_PUBLIC_CONVEX_URL ||
  !process.env.CONVEX_SERVICE_ROLE_KEY
) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL or CONVEX_SERVICE_ROLE_KEY environment variable is not defined',
  );
}

const convexKey = process.env.CONVEX_SERVICE_ROLE_KEY;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await getServerUser();
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

    // Use Convex to get inviter team information
    const inviterTeam = await convex.query(api.teams.getUserTeam, {
      userId: user.id,
    });

    if (!inviterTeam) {
      throw new Error('Inviter team not found');
    }

    // Use Convex to get the invitation
    const invite = await convex.query(api.invitations.getTeamInvitation, {
      serviceKey: convexKey,
      inviteeEmail: email,
      teamId: inviterTeam.team_id,
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    let emailSent = false;
    let emailMessage = 'Invitation sent, but email delivery is not configured.';

    if (RESEND_API_KEY && invite.team_name) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'PentestGPT <noreply@pentestgpt.ai>',
          to: email,
          subject: `Invitation to join ${invite.team_name}`,
          html: getInvitationEmailHtml(invite.team_name, `${APP_URL}/login`),
        }),
      });

      emailSent = true;
      emailMessage = 'Invitation sent successfully.';
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
      emailSent,
      emailMessage,
    });
  } catch (error) {
    console.error('Error in send-invite:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 400 },
    );
  }
}

const getInvitationEmailHtml = (
  teamName: string,
  url: string,
) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invitation to join ${teamName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
            font-size: 16px;
            line-height: 1.5;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            max-width: 600px;
            margin: 20px auto;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h2 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        p {
            margin: 10px 0;
        }
        .button {
            display: inline-block;
            background-color: #3498db;
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #2980b9;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                padding: 10px;
            }
            .button {
                padding: 10px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Invitation to join ${teamName}</h2>
        <p>You've been invited to join the ${teamName} team on PentestGPT. Click the button below to accept:</p>
        <p><a href="${url}" class="button" target="_blank">Accept Invitation</a></p>
    </div>
</body>
</html>`;
