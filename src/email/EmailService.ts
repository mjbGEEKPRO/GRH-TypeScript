import emailjs from '@emailjs/browser';


const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'ma clé', // Remplace par ta clé publique
  SERVICE_ID: 'monservice', // Remplace par ton service ID
  TEMPLATES: {
    MAGIC_LINK: 'template_magic_link',      // Template pour lien magique
    TICKET_CONFIRMATION: 'template_ticket_confirm', // Template confirmation ticket
    ADMIN_NOTIFICATION: 'template_admin_notif',     // Template notification admin
    NEW_MESSAGE: 'template_new_message',            // Template nouveau message
  }
};


emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);


class EmailService {
  //Envoyer le lien magique d'accès
  
  static async sendMagicLink(emailData: {
    to_email: string;
    to_name: string;
    access_link: string;
    expires_in: string;
  }) {
    try {
      const templateParams = {
        to_email: emailData.to_email,
        to_name: emailData.to_name,
        access_link: emailData.access_link,
        expires_in: emailData.expires_in,
        subject: 'Accès à vos tickets de support',
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.MAGIC_LINK,
        templateParams
      );

      return {
        success: true,
        message: 'Email envoyé avec succès',
        response,
      };
    } catch (error: any) {
      console.error('Erreur envoi magic link:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email',
        error,
      };
    }
  }

  /**
   * Envoyer la confirmation de création de ticket
   */
  static async sendTicketConfirmation(emailData: {
    to_email: string;
    to_name: string;
    ticket_id: number;
    access_link: string;
  }) {
    try {
      const templateParams = {
        to_email: emailData.to_email,
        to_name: emailData.to_name,
        ticket_id: emailData.ticket_id,
        access_link: emailData.access_link,
        subject: `Ticket #${emailData.ticket_id} - Confirmation`,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.TICKET_CONFIRMATION,
        templateParams
      );

      return {
        success: true,
        message: 'Email de confirmation envoyé',
        response,
      };
    } catch (error: any) {
      console.error('Erreur envoi confirmation:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi',
        error,
      };
    }
  }

  /**
   * Notifier les administrateurs d'un nouveau ticket
   */
  static async notifyAdmins(emailData: {
    ticket_id: number;
    user_name: string;
    raison: string;
    priority: string;
  }) {
    try {
      // EmailJS envoie automatiquement aux emails configurés dans le template
      const templateParams = {
        ticket_id: emailData.ticket_id,
        user_name: emailData.user_name,
        raison: emailData.raison,
        priority: emailData.priority,
        subject: `Nouveau ticket support #${emailData.ticket_id}`,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATES.ADMIN_NOTIFICATION,
        templateParams
      );

      return {
        success: true,
        message: 'Admins notifiés',
        response,
      };
    } catch (error: any) {
      console.error('Erreur notification admins:', error);
      return {
        success: false,
        message: 'Erreur lors de la notification',
        error,
      };
    }
  }

  /**
   * Notifier qu'un nouveau message a été reçu
   */
  static async notifyNewMessage(emailData: {
    admins: Array<{ email: string; name: string }>;
    ticket_id: number;
    user_name: string;
    message_preview: string;
  }) {
    try {
      // Envoyer à chaque admin
      const promises = emailData.admins.map((admin) => {
        const templateParams = {
          to_email: admin.email,
          to_name: admin.name,
          ticket_id: emailData.ticket_id,
          user_name: emailData.user_name,
          message_preview: emailData.message_preview,
          subject: `Nouveau message - Ticket #${emailData.ticket_id}`,
        };

        return emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATES.NEW_MESSAGE,
          templateParams
        );
      });

      await Promise.all(promises);

      return {
        success: true,
        message: 'Notifications envoyées',
      };
    } catch (error: any) {
      console.error('Erreur notification message:', error);
      return {
        success: false,
        message: 'Erreur lors de la notification',
        error,
      };
    }
  }
}

export default EmailService;
