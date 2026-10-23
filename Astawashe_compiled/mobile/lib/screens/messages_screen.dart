import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/api_service.dart';

class MessagesScreen extends StatefulWidget {
  final AuthSession session;

  const MessagesScreen({super.key, required this.session});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  late final ApiService _apiService;

  List<Map<String, dynamic>> _cases = [];
  bool _loading = true;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadCases();
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }

  String _value(dynamic value, [String fallback = 'Not provided']) {
    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }
    return value.toString();
  }

  Future<void> _loadCases() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final cases = await _apiService.getDoctorCases(
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;
      setState(() {
        _cases = cases;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _openConversation(Map<String, dynamic> caseRecord) async {
    final caseId = caseRecord['id']?.toString();
    if (caseId == null || caseId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This case has no valid ID.')),
      );
      return;
    }

    final patient = caseRecord['patient'] is Map<String, dynamic>
        ? caseRecord['patient'] as Map<String, dynamic>
        : <String, dynamic>{};

    final patientName = _value(
      patient['fullName'] ?? patient['name'],
      'Patient',
    );

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CaseConversationScreen(
          apiService: _apiService,
          session: widget.session,
          caseId: caseId,
          title: patientName,
          caseTitle: _value(caseRecord['title'], 'Patient conversation'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredCases = _cases.where((record) {
      final patient = record['patient'] is Map<String, dynamic>
          ? record['patient'] as Map<String, dynamic>
          : <String, dynamic>{};

      final name = (patient['fullName'] ?? patient['name'] ?? '')
          .toString()
          .toLowerCase();
      final title = (record['title'] ?? '').toString().toLowerCase();
      final query = _search.toLowerCase();

      return name.contains(query) || title.contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _loadCases,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _loadCases,
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            )
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    decoration: const InputDecoration(
                      labelText: 'Search cases or patients',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      setState(() => _search = value.trim());
                    },
                  ),
                ),
                Expanded(
                  child: filteredCases.isEmpty
                      ? Center(
                          child: Text(
                            _cases.isEmpty
                                ? 'No cases are available yet.'
                                : 'No matching cases found.',
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadCases,
                          child: ListView.separated(
                            itemCount: filteredCases.length,
                            separatorBuilder: (_, _) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final record = filteredCases[index];
                              final patient =
                                  record['patient'] is Map<String, dynamic>
                                  ? record['patient'] as Map<String, dynamic>
                                  : <String, dynamic>{};

                              final name = _value(
                                patient['fullName'] ?? patient['name'],
                                'Patient',
                              );

                              return ListTile(
                                leading: const CircleAvatar(
                                  child: Icon(Icons.person_outline),
                                ),
                                title: Text(name),
                                subtitle: Text(
                                  _value(
                                    record['title'],
                                    'Patient conversation',
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () => _openConversation(record),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }
}

class CaseConversationScreen extends StatefulWidget {
  final ApiService apiService;
  final AuthSession session;
  final String caseId;
  final String title;
  final String caseTitle;

  const CaseConversationScreen({
    super.key,
    required this.apiService,
    required this.session,
    required this.caseId,
    required this.title,
    required this.caseTitle,
  });

  @override
  State<CaseConversationScreen> createState() => _CaseConversationScreenState();
}

class _CaseConversationScreenState extends State<CaseConversationScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final messages = await widget.apiService.getCaseMessages(
        caseId: widget.caseId,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;
      setState(() {
        _messages = messages;
        _loading = false;
      });
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _sending) return;

    setState(() => _sending = true);

    try {
      await widget.apiService.sendCaseMessage(
        caseId: widget.caseId,
        content: content,
        accessToken: widget.session.accessToken,
      );

      if (!mounted) return;
      _messageController.clear();
      await _loadMessages();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not send message: '
            '${error.toString().replaceFirst('Exception: ', '')}',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _messageText(Map<String, dynamic> message) {
    return message['content']?.toString() ?? '';
  }

  String _messageSender(Map<String, dynamic> message) {
    return message['senderName']?.toString() ??
        message['sender']?['name']?.toString() ??
        message['sender']?['fullName']?.toString() ??
        'Sender';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: Text(
              widget.caseTitle,
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_error!, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: _loadMessages,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : _messages.isEmpty
                ? const Center(
                    child: Text('No messages yet. Start the conversation.'),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final sender = _messageSender(message);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                sender,
                                style: Theme.of(context).textTheme.labelMedium,
                              ),
                              const SizedBox(height: 6),
                              Text(_messageText(message)),
                              if (message['createdAt'] != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  message['createdAt']
                                      .toString()
                                      .replaceFirst('T', ' ')
                                      .split('.')
                                      .first,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        hintText: 'Write a message...',
                        border: OutlineInputBorder(),
                      ),
                      enabled: !_sending,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: 'Send message',
                    onPressed: _sending ? null : _sendMessage,
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
