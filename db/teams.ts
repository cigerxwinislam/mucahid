import { makeAuthenticatedRequest } from '@/lib/api/convex';
import { toast } from 'sonner';

export const getTeamMembersByTeamId = async (): Promise<any[]> => {
  try {
    const data = await makeAuthenticatedRequest('/api/teams', 'POST', {
      type: 'getTeamMembersByUserId',
    });

    return data?.data || [];
  } catch (error) {
    console.error('Error getting team members:', error);
    throw error;
  }
};

export const removeUserFromTeam = async (
  teamId: string,
  memberEmail: string,
): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/teams', 'POST', {
      type: 'removeUserFromTeam',
      teamId,
      memberEmail,
    });

    return data?.data || false;
  } catch (error) {
    console.error('Error removing user from team:', error);
    throw error;
  }
};

export const inviteUserToTeam = async (
  teamId: string,
  email: string,
): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/teams', 'POST', {
      type: 'inviteUserToTeam',
      teamId,
      inviteeEmail: email,
    });

    // Only send invitation email if the mutation was successful
    if (data?.data) {
      await sendInvitationEmail(email);
    }

    return data?.data || false;
  } catch (error) {
    console.error('Error in inviteUserToTeam:', error);
    throw error;
  }
};

async function sendInvitationEmail(email: string) {
  const response = await fetch('/api/subscription/send-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'An error occurred while sending the invitation',
    );
  }

  if (!data.success) {
    console.error('Failed to send invitation email:', data.error);
    throw new Error(data.error || 'Failed to send invitation email');
  }

  if (data.emailSent) {
    toast.success('Invitation sent successfully.');
  }
}

export const acceptTeamInvitation = async (
  invitationId: string,
): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/teams', 'POST', {
      type: 'acceptTeamInvitation',
      invitationId,
    });

    return data?.data || false;
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    throw error;
  }
};

export const rejectTeamInvitation = async (
  invitationId: string,
): Promise<boolean> => {
  try {
    const data = await makeAuthenticatedRequest('/api/teams', 'POST', {
      type: 'rejectTeamInvitation',
      invitationId,
    });

    return data?.data || false;
  } catch (error) {
    console.error('Error rejecting team invitation:', error);
    throw error;
  }
};
