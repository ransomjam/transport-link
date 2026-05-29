import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// POST /api/messages - Public endpoint to submit a contact form
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, service, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        service,
        message
      }
    });

    return res.status(201).json({ success: true, message: "Message received." });
  } catch (error) {
    console.error("Error creating contact message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages - Admin only endpoint to list messages
router.get("/", requireAdmin, async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/messages/:id/read - Admin only endpoint to mark a message as read
router.patch("/:id/read", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true }
    });

    return res.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/messages/:id - Admin only endpoint to delete a message
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contactMessage.delete({
      where: { id }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
