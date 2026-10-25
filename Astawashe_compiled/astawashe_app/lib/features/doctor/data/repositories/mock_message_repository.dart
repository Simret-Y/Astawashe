import '../../domain/models/message_models.dart';
import '../../domain/repositories/message_repository.dart';

class MockMessageRepository implements MessageRepository {
  late List<Conversation> _conversations;
  late Map<String, List<DirectMessage>> _messages;

  MockMessageRepository() {
    _initMockData();
  }

  void _initMockData() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    _conversations = [
      Conversation(
        id: 'conv-amina',
        otherUserId: 'p-amina',
        otherUserName: 'Amina Tesfaye',
        otherUserRole: 'PATIENT',
        lastMessage: 'You: How are you feeling today?',
        lastMessageTime: today.add(const Duration(hours: 10, minutes: 24)),
        unreadCount: 0,
      ),
      Conversation(
        id: 'conv-khalid',
        otherUserId: 'p-khalid',
        otherUserName: 'Khalid Abebe',
        otherUserRole: 'PATIENT',
        lastMessage: 'Thank you, doctor!',
        lastMessageTime: today.subtract(const Duration(days: 1, hours: 3)),
        unreadCount: 1,
      ),
      Conversation(
        id: 'conv-sara',
        otherUserId: 'p-sara',
        otherUserName: 'Sara Mohamed',
        otherUserRole: 'PATIENT',
        lastMessage: 'You: Got it, doctor!',
        lastMessageTime: today.subtract(const Duration(days: 1, hours: 6)),
        unreadCount: 0,
      ),
      Conversation(
        id: 'conv-daniel',
        otherUserId: 'p-daniel',
        otherUserName: 'Daniel Girma',
        otherUserRole: 'PATIENT',
        lastMessage: 'You: Got it, thank you!',
        lastMessageTime: today.subtract(const Duration(days: 3)),
        unreadCount: 0,
      ),
      Conversation(
        id: 'conv-lidya',
        otherUserId: 'p-lidya',
        otherUserName: 'Lidya Kassa',
        otherUserRole: 'PATIENT',
        lastMessage: "I've taken my meds.",
        lastMessageTime: today.subtract(const Duration(days: 4)),
        unreadCount: 0,
      ),
    ];

    _messages = {
      'conv-amina': [
        DirectMessage(
          id: 'm1',
          senderId: 'p-amina',
          senderName: 'Amina Tesfaye',
          senderRole: 'PATIENT',
          recipientId: 'doctor-001',
          recipientName: 'Dr. Ahmed',
          message:
              'Hello Doctor Ahmed, I missed my morning Metformin dose today. Should I take it now?',
          timestamp: today.add(const Duration(hours: 10, minutes: 15)),
        ),
        DirectMessage(
          id: 'm2',
          senderId: 'doctor-001',
          senderName: 'Dr. Ahmed',
          senderRole: 'DOCTOR',
          recipientId: 'p-amina',
          recipientName: 'Amina Tesfaye',
          message:
              'Hello Amina. If it is within 2 hours, please take it with a light snack. Otherwise wait until the next scheduled dose.',
          timestamp: today.add(const Duration(hours: 10, minutes: 20)),
        ),
        DirectMessage(
          id: 'm3',
          senderId: 'doctor-001',
          senderName: 'Dr. Ahmed',
          senderRole: 'DOCTOR',
          recipientId: 'p-amina',
          recipientName: 'Amina Tesfaye',
          message: 'How are you feeling today?',
          timestamp: today.add(const Duration(hours: 10, minutes: 24)),
        ),
      ],
      'conv-khalid': [
        DirectMessage(
          id: 'mk1',
          senderId: 'doctor-001',
          senderName: 'Dr. Ahmed',
          senderRole: 'DOCTOR',
          recipientId: 'p-khalid',
          recipientName: 'Khalid Abebe',
          message: 'Your adherence rate this week is great! Keep it up.',
          timestamp: today.subtract(const Duration(days: 1, hours: 4)),
        ),
        DirectMessage(
          id: 'mk2',
          senderId: 'p-khalid',
          senderName: 'Khalid Abebe',
          senderRole: 'PATIENT',
          recipientId: 'doctor-001',
          recipientName: 'Dr. Ahmed',
          message: 'Thank you, doctor!',
          timestamp: today.subtract(const Duration(days: 1, hours: 3)),
        ),
      ],
    };
  }

  @override
  Future<List<Conversation>> getConversations(String userId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _conversations;
  }

  @override
  Future<List<DirectMessage>> getMessages(String conversationId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _messages[conversationId] ??
        [
          DirectMessage(
            id: 'init-msg',
            senderId: 'doctor-001',
            senderName: 'Dr. Ahmed',
            senderRole: 'DOCTOR',
            recipientId: conversationId,
            recipientName: 'Patient',
            message:
                'Hello! Feel free to send any questions about your medication.',
            timestamp: DateTime.now().subtract(const Duration(days: 1)),
          ),
        ];
  }

  @override
  Future<DirectMessage> sendMessage({
    required String senderId,
    required String senderName,
    required String senderRole,
    required String recipientId,
    required String recipientName,
    required String message,
  }) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final newMsg = DirectMessage(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      senderId: senderId,
      senderName: senderName,
      senderRole: senderRole,
      recipientId: recipientId,
      recipientName: recipientName,
      message: message,
      timestamp: DateTime.now(),
    );

    final convKey = _messages.containsKey('conv-$recipientId')
        ? 'conv-$recipientId'
        : _messages.keys.firstWhere(
            (k) => k.contains(recipientId),
            orElse: () => 'conv-$recipientId',
          );

    if (!_messages.containsKey(convKey)) {
      _messages[convKey] = [];
    }
    _messages[convKey]!.add(newMsg);

    // Update conversation snippet
    final convIndex = _conversations.indexWhere(
      (c) => c.otherUserId == recipientId || c.id == convKey,
    );
    if (convIndex >= 0) {
      final old = _conversations[convIndex];
      _conversations[convIndex] = Conversation(
        id: old.id,
        otherUserId: old.otherUserId,
        otherUserName: old.otherUserName,
        otherUserRole: old.otherUserRole,
        lastMessage: 'You: $message',
        lastMessageTime: DateTime.now(),
        unreadCount: 0,
        avatarUrl: old.avatarUrl,
      );
    }

    return newMsg;
  }
}
