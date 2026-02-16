const SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
const TEMPLATE_ID_CREATION = process.env.EMAILJS_TEMPLATE_ID_CREATION!;
const TEMPLATE_ID_REMINDER = process.env.EMAILJS_TEMPLATE_ID_REMINDER!;
const TEMPLATE_ID_LOGIN_CODE = process.env.EMAILJS_TEMPLATE_ID_LOGIN_CODE || TEMPLATE_ID_CREATION; // Fallback si non défini
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;

export interface EmailParams {
  parent_name: string;
  child_name: string;
  event_type: string;
  event_date: string;
  event_time: string;
  event_location: string;
  link: string;
}

export interface LoginCodeEmailParams {
  parent_name: string;
  site_url: string;
  login_code: string;
}

async function sendEmail(templateId: string, params: EmailParams): Promise<void> {
  const url = `https://api.emailjs.com/api/v1.0/email/send`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: PUBLIC_KEY,
      template_params: {
        parent_name: params.parent_name,
        child_name: params.child_name,
        event_type: params.event_type,
        event_date: params.event_date,
        event_time: params.event_time,
        event_location: params.event_location,
        link: params.link,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
  }
}

export async function sendCreationEmail(params: EmailParams): Promise<void> {
  try {
    await sendEmail(TEMPLATE_ID_CREATION, params);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de création:', error);
    throw error;
  }
}

export async function sendReminderEmail(params: EmailParams): Promise<void> {
  try {
    await sendEmail(TEMPLATE_ID_REMINDER, params);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de rappel:', error);
    throw error;
  }
}

async function sendLoginCodeEmail(templateId: string, params: LoginCodeEmailParams): Promise<void> {
  const url = `https://api.emailjs.com/api/v1.0/email/send`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: PUBLIC_KEY,
      template_params: {
        parent_name: params.parent_name,
        site_url: params.site_url,
        login_code: params.login_code,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
  }
}

export async function sendLoginCodeEmailToParent(params: LoginCodeEmailParams): Promise<void> {
  try {
    await sendLoginCodeEmail(TEMPLATE_ID_LOGIN_CODE, params);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email avec code de connexion:', error);
    throw error;
  }
}
