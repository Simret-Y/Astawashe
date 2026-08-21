const prisma = require("../db/prisma");
const { env } = require("../config/env");

// Abstract notification provider interface
class NotificationProvider {
  async sendVoiceReminder(recipientId, message) {
    throw new Error("Not implemented");
  }

  async sendSMS(recipientId, message) {
    throw new Error("Not implemented");
  }

  async sendUSSD(recipientId, message) {
    throw new Error("Not implemented");
  }
}

// Demo provider - for development/testing
class DemoNotificationProvider extends NotificationProvider {
  async sendVoiceReminder(recipientId, message, options = {}) {
    // Create a notification delivery record
    const delivery = await prisma.notificationDelivery.create({
      data: {
        recipientId,
        channel: "VOICE",
        messageType: "REMINDER",
        scheduledAt: new Date(),
        status: "SENT",
        provider: "DEMO",
        providerMessageId: `DEMO-VOICE-${Date.now()}`,
        message: message || "Medication reminder" // Store message for demo
      }
    });

    // In demo mode, log to console
    console.log(`[DEMO VOICE REMINDER] To: ${recipientId}`);
    console.log(`  Message: ${message}`);
    console.log(`  DeliveryID: ${delivery.id}`);
    console.log(`  Expected response methods: 1 (TAKEN) or 2 (NOT_TAKEN)`);

    return {
      success: true,
      provider: "DEMO",
      deliveryId: delivery.id,
      message: "Voice reminder sent (DEMO MODE)",
      instructions: "Call 1 for TAKEN or 2 for NOT_TAKEN"
    };
  }

  async sendSMS(recipientId, message, options = {}) {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        recipientId,
        channel: "SMS",
        messageType: options.messageType || "REMINDER",
        scheduledAt: new Date(),
        status: "SENT",
        provider: "DEMO",
        providerMessageId: `DEMO-SMS-${Date.now()}`
      }
    });

    console.log(`[DEMO SMS] To: ${recipientId}`);
    console.log(`  Message: ${message}`);
    console.log(`  DeliveryID: ${delivery.id}`);

    return {
      success: true,
      provider: "DEMO",
      deliveryId: delivery.id,
      message: "SMS sent (DEMO MODE)"
    };
  }

  async sendUSSD(recipientId, message, options = {}) {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        recipientId,
        channel: "USSD",
        messageType: options.messageType || "REMINDER",
        scheduledAt: new Date(),
        status: "SENT",
        provider: "DEMO",
        providerMessageId: `DEMO-USSD-${Date.now()}`
      }
    });

    console.log(`[DEMO USSD] To: ${recipientId}`);
    console.log(`  Message: ${message}`);
    console.log(`  DeliveryID: ${delivery.id}`);

    return {
      success: true,
      provider: "DEMO",
      deliveryId: delivery.id,
      message: "USSD sent (DEMO MODE)"
    };
  }

  // Record response for demo
  async recordResponse(deliveryId, response) {
    const delivery = await prisma.notificationDelivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    const updated = await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        response,
        responseAt: new Date(),
        status: response ? "DELIVERED" : "EXPIRED"
      }
    });

    console.log(`[DEMO RESPONSE] DeliveryID: ${deliveryId}, Response: ${response}`);

    return updated;
  }
}

// Production provider placeholder (for future integration)
class EthioTelecomNotificationProvider extends NotificationProvider {
  async sendVoiceReminder(recipientId, message, options = {}) {
    throw new Error("EthioTelecom API not yet implemented");
  }

  async sendSMS(recipientId, message, options = {}) {
    throw new Error("EthioTelecom API not yet implemented");
  }

  async sendUSSD(recipientId, message, options = {}) {
    throw new Error("EthioTelecom API not yet implemented");
  }
}

// Factory to get appropriate provider
const getNotificationProvider = () => {
  if (env.demoMode || env.voiceProvider === "demo") {
    return new DemoNotificationProvider();
  }

  if (env.voiceProvider === "ethio_telecom") {
    return new EthioTelecomNotificationProvider();
  }

  // Default to demo
  return new DemoNotificationProvider();
};

module.exports = {
  NotificationProvider,
  DemoNotificationProvider,
  EthioTelecomNotificationProvider,
  getNotificationProvider
};
