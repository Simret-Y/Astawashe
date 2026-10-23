import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../models/auth_session.dart';

class NotificationsScreen extends StatefulWidget {
  final AuthSession session;
  final Future<void> Function(Map<String, dynamic> notification)?
  onOpenNotification;

  const NotificationsScreen({
    super.key,
    required this.session,
    this.onOpenNotification,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final ApiService _apiService;

  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadNotifications();
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifications = await _apiService.getNotifications(
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;

      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(Map<String, dynamic> notification) async {
    final id = notification['id']?.toString();

    if (id == null || id.isEmpty || notification['readAt'] != null) {
      return;
    }

    try {
      await _apiService.markNotificationRead(
        notificationId: id,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;

      setState(() {
        final index = _notifications.indexWhere(
          (item) => item['id']?.toString() == id,
        );

        if (index != -1) {
          _notifications[index] = {
            ..._notifications[index],
            'readAt': DateTime.now().toIso8601String(),
          };
        }
      });
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not mark notification as read: $error')),
      );
    }
  }

  Future<void> _openNotification(Map<String, dynamic> notification) async {
    final relatedId = notification['relatedId']?.toString();

    if (notification['readAt'] == null) {
      await _markAsRead(notification);
    }

    if (!mounted) return;

    if (relatedId != null &&
        relatedId.isNotEmpty &&
        widget.onOpenNotification != null) {
      await widget.onOpenNotification!(notification);
    }
  }

  IconData _notificationIcon(Map<String, dynamic> notification) {
    final type =
        (notification['notificationType'] ?? notification['type'] ?? '')
            .toString()
            .toUpperCase();

    if (type == 'ALERT') return Icons.warning_amber_rounded;
    if (type == 'MEDICATION') return Icons.medication_outlined;

    return Icons.notifications_outlined;
  }

  Widget _buildNotification(Map<String, dynamic> notification) {
    final isRead = notification['readAt'] != null;
    final title = notification['title']?.toString() ?? 'Notification';
    final message = notification['message']?.toString() ?? '';
    final createdAt = DateTime.tryParse(
      notification['createdAt']?.toString() ?? '',
    );

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        onTap: () => _openNotification(notification),
        leading: CircleAvatar(
          backgroundColor: isRead
              ? Colors.grey.shade200
              : Theme.of(context).colorScheme.primaryContainer,
          child: Icon(_notificationIcon(notification)),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(message),
              if (createdAt != null) ...[
                const SizedBox(height: 8),
                Text(
                  MaterialLocalizations.of(
                    context,
                  ).formatMediumDate(createdAt.toLocal()),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
              if (!isRead) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => _markAsRead(notification),
                  child: const Text('Mark as read'),
                ),
              ],
            ],
          ),
        ),
        isThreeLine: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            tooltip: 'Refresh notifications',
            onPressed: _loadNotifications,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Could not load notifications.\n$_error',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _loadNotifications,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : _notifications.isEmpty
          ? const Center(child: Text('You have no notifications yet.'))
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _notifications.length,
                itemBuilder: (context, index) =>
                    _buildNotification(_notifications[index]),
              ),
            ),
    );
  }
}
