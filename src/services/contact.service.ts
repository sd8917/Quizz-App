import { sendContactSupportEmail } from '../utils/mailer';

export interface IContactRequest {
  email: string;
  message: string;
  username: string;
}

export class ContactService {
  /**
   * Send a support request email to the support team
   * @param contactData - Contact request data including user email and message
   * @returns Promise with success message
   */
  async sendSupportRequest(contactData: IContactRequest): Promise<{ message: string }> {
    const { email, message, username } = contactData;

    // Send the support email
    await sendContactSupportEmail(email, username, message);

    return {
      message: 'Your support request has been sent successfully. We will get back to you soon.'
    };
  }
}
