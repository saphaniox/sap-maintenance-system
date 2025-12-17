const nodemailer = require('nodemailer').default || require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter - configure with your email service
    // For development, you can use services like Ethereal, Gmail, SendGrid, etc.
    
    // Skip transporter creation if email not configured (will use mock)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured (EMAIL_USER/EMAIL_PASSWORD missing). Using mock emails.');
      this.transporter = null;
      return;
    }
    
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASSWORD, // your email password or app password
      },
    });

    // Verify connection (optional)
    this.verifyConnection();
  }

  async verifyConnection() {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.verify();
      console.log('Email service ready');
    } catch (error) {
      console.error('Email service error:', error.message);
    }
  }

  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
      return { mock: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Maintenance Tracker" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendMaintenanceReminder(to, maintenance) {
    const daysUntil = Math.ceil(
      (new Date(maintenance.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const subject = `Upcoming Maintenance: ${maintenance.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #667eea;">Maintenance Reminder</h2>
        <p>This is a reminder that the following maintenance is scheduled:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${maintenance.title}</h3>
          <p><strong>Machine:</strong> ${maintenance.machineId?.name || 'N/A'}</p>
          <p><strong>Description:</strong> ${maintenance.description}</p>
          <p><strong>Scheduled Date:</strong> ${new Date(maintenance.scheduledDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(maintenance.priority)}; font-weight: bold;">${maintenance.priority?.toUpperCase()}</span></p>
          <p><strong>Days Until:</strong> ${daysUntil} day(s)</p>
        </div>
        
        <p>Please ensure you're prepared for this maintenance activity.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          This is an automated message from Maintenance Tracker System.
        </p>
      </div>
    `;

    const text = `Maintenance Reminder\n\n${maintenance.title}\nScheduled: ${new Date(maintenance.scheduledDate).toLocaleDateString()}\nPriority: ${maintenance.priority}\nDays Until: ${daysUntil}`;

    return await this.sendEmail(to, subject, html, text);
  }

  async sendLowStockAlert(to, items) {
    const subject = `Low Stock Alert: ${items.length} Item(s)`;
    
    const itemsList = items.map(item => `
      <li style="margin: 10px 0;">
        <strong>${item.name}</strong> - 
        Current: ${item.currentStock} ${item.unit}, 
        Minimum: ${item.minStock} ${item.unit}
        ${item.currentStock === 0 ? '<span style="color: #dc3545; font-weight: bold;"> OUT OF STOCK</span>' : ''}
      </li>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #ffc107;">⚠️ Low Stock Alert</h2>
        <p>The following inventory items are running low or out of stock:</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <ul style="margin: 0; padding-left: 20px;">
            ${itemsList}
          </ul>
        </div>
        
        <p>Please reorder these items to maintain adequate inventory levels.</p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          This is an automated message from Maintenance Tracker System.
        </p>
      </div>
    `;

    const text = `Low Stock Alert\n\n${items.map(i => `${i.name}: ${i.currentStock}/${i.minStock} ${i.unit}`).join('\n')}`;

    return await this.sendEmail(to, subject, html, text);
  }

  async sendRequisitionNotification(to, requisition, action) {
    const subject = `Requisition ${action}: ${requisition.department}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #667eea;">Requisition ${action}</h2>
        <p>A requisition has been <strong>${action.toLowerCase()}</strong>:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Department:</strong> ${requisition.department}</p>
          <p><strong>Items:</strong> ${requisition.items?.length || 0} item(s)</p>
          <p><strong>Needed By:</strong> ${new Date(requisition.neededBy).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${requisition.status}</p>
        </div>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          This is an automated message from Maintenance Tracker System.
        </p>
      </div>
    `;

    const text = `Requisition ${action}\n\nDepartment: ${requisition.department}\nStatus: ${requisition.status}`;

    return await this.sendEmail(to, subject, html, text);
  }

  getPriorityColor(priority) {
    const colors = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };
    return colors[priority] || '#6c757d';
  }
}

module.exports = new EmailService();
