const express = require("express");
const Task = require("../models/Task");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET all tasks
router.get("/", protect, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user })
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch tasks",
            error: error.message
        });
    }
});

// CREATE task
router.post("/", protect, async (req, res) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            user: req.user
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create task",
            error: error.message
        });
    }
});

// UPDATE task
router.put("/:id", protect, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const {
            title,
            description,
            status,
            priority,
            dueDate
        } = req.body;

        task.title = title ?? task.title;
        task.description = description ?? task.description;
        task.status = status ?? task.status;
        task.priority = priority ?? task.priority;
        task.dueDate = dueDate ?? task.dueDate;

        await task.save();

        res.json({
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
});

// DELETE task
router.delete("/:id", protect, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete task",
            error: error.message
        });
    }
});

module.exports = router;