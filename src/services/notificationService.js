/**
 * Real-time Notification Service
 * Handles live updates for attendance marking events
 */

class NotificationService {
    constructor() {
        // Store active SSE connections
        this.connections = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 50;
    }

    /**
     * Add a new SSE connection
     */
    addConnection(userId, userRole, res) {
        const connectionId = `${userRole}_${userId}_${Date.now()}`;

        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        });

        // Send initial connection message
        res.write(`data: ${JSON.stringify({
            type: 'connected',
            message: 'Connected to live updates',
            timestamp: new Date().toISOString()
        })}\n\n`);

        // Store connection
        this.connections.set(connectionId, {
            userId,
            userRole,
            res,
            connectedAt: Date.now()
        });

        // Send recent event history
        this.eventHistory.slice(-5).forEach(event => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        // Handle client disconnect
        req.on('close', () => {
            this.connections.delete(connectionId);
        });

        return connectionId;
    }

    /**
     * Broadcast event to all connected clients
     */
    broadcast(event) {
        // Add to history
        this.eventHistory.push({
            ...event,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });

        // Keep history size manageable
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Send to all connected clients
        const data = JSON.stringify(event);
        this.connections.forEach((connection, connectionId) => {
            try {
                // Check if user should receive this event
                if (this.shouldReceiveEvent(connection, event)) {
                    connection.res.write(`data: ${data}\n\n`);
                }
            } catch (error) {
                console.error(`Error sending to connection ${connectionId}:`, error);
                this.connections.delete(connectionId);
            }
        });
    }

    /**
     * Determine if a user should receive an event
     */
    shouldReceiveEvent(connection, event) {
        const { userRole, userId } = connection;

        // Admins see everything
        if (userRole === 'admin') return true;

        // Teachers see their own events and public events
        if (userRole === 'teacher') {
            return event.public || event.teacherId === userId;
        }

        // Students see their own events
        if (userRole === 'student') {
            return event.public || event.studentId === userId;
        }

        return false;
    }

    /**
     * Send attendance marked notification
     */
    notifyAttendanceMarked(data) {
        this.broadcast({
            type: 'attendance_marked',
            subject: data.subject,
            stream: data.stream,
            division: data.division,
            year: data.year,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            present: data.present,
            absent: data.absent,
            total: data.total,
            sessionId: data.sessionId,
            public: true, // Visible to all
            message: `${data.teacherName} marked attendance for ${data.subject} - ${data.stream} ${data.division}`
        });
    }

    /**
     * Send defaulter list generated notification
     */
    notifyDefaulterGenerated(data) {
        this.broadcast({
            type: 'defaulter_generated',
            count: data.count,
            threshold: data.threshold,
            filters: data.filters,
            generatedBy: data.generatedBy,
            role: data.role,
            public: false,
            message: `Defaulter list generated with ${data.count} students below ${data.threshold}%`
        });
    }

    /**
     * Send data import notification
     */
    notifyDataImport(data) {
        this.broadcast({
            type: 'data_import',
            dataType: data.dataType, // 'students' or 'teachers'
            count: data.count,
            importedBy: data.importedBy,
            public: true,
            message: `${data.count} ${data.dataType} imported successfully`
        });
    }

    /**
     * Send stats update notification
     */
    notifyStatsUpdate(data) {
        this.broadcast({
            type: 'stats_update',
            stats: data.stats,
            public: true,
            message: 'Dashboard statistics updated'
        });
    }

    /**
     * Get connection count
     */
    getConnectionCount() {
        return this.connections.size;
    }

    /**
     * Get connections by role
     */
    getConnectionsByRole(role) {
        return Array.from(this.connections.values())
            .filter(conn => conn.userRole === role).length;
    }

    /**
     * Cleanup old connections
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        this.connections.forEach((connection, connectionId) => {
            if (now - connection.connectedAt > maxAge) {
                try {
                    connection.res.end();
                } catch (error) {
                    // Connection already closed
                }
                this.connections.delete(connectionId);
            }
        });
    }
}

// Singleton instance
const notificationService = new NotificationService();

// Cleanup every 5 minutes
setInterval(() => {
    notificationService.cleanup();
}, 5 * 60 * 1000);

export default notificationService;
