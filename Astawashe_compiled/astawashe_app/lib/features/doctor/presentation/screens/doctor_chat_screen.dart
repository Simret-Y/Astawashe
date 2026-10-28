import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_utils.dart';
import '../../domain/models/message_models.dart';
import '../../domain/repositories/message_repository.dart';
import '../../../auth/presentation/providers/auth_state_provider.dart';
import 'patient_detail_screen.dart';

final chatMessagesProvider = FutureProvider.autoDispose
    .family<List<DirectMessage>, String>((ref, convId) async {
      final repo = ref.watch(messageRepositoryProvider);
      return repo.getMessages(convId);
    });

class DoctorChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const DoctorChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<DoctorChatScreen> createState() => _DoctorChatScreenState();
}

class _DoctorChatScreenState extends ConsumerState<DoctorChatScreen> {
  final _textController = TextEditingController();
  final List<DirectMessage> _localMessages = [];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _textController.clear();

    final user = ref.read(authStateProvider).user;
    final doctorName =
        user?.profileData?['name']?.toString() ?? user?.fullName ?? 'Doctor';
    final repo = ref.read(messageRepositoryProvider);
    final sent = await repo.sendMessage(
      senderId: user?.id ?? 'doctor-001',
      senderName: doctorName.startsWith('Dr.') ? doctorName : 'Dr. $doctorName',
      senderRole: 'DOCTOR',
      recipientId: widget.conversationId.replaceFirst('conv-', ''),
      recipientName: 'Patient',
      message: text,
    );

    setState(() {
      _localMessages.add(sent);
    });
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(
      chatMessagesProvider(widget.conversationId),
    );
    final recipientId = widget.conversationId.replaceFirst('conv-', '');
    final patientAsync = ref.watch(singlePatientDetailProvider(recipientId));
    final chatTitle =
        patientAsync.value?.name ??
        (widget.conversationId.contains('amina')
            ? 'Amina Tesfaye'
            : widget.conversationId.contains('khalid')
            ? 'Khalid Abebe'
            : 'Patient Chat');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(chatTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: messagesAsync.when(
                data: (messages) {
                  final allMessages = [...messages, ..._localMessages];
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    itemCount: allMessages.length,
                    itemBuilder: (context, index) {
                      final msg = allMessages[index];
                      final isMe = msg.senderRole == 'DOCTOR';

                      return Align(
                        alignment: isMe
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.75,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: isMe ? AppColors.primary : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isMe ? 16 : 4),
                              bottomRight: Radius.circular(isMe ? 4 : 16),
                            ),
                            border: Border.all(
                              color: isMe
                                  ? AppColors.primary
                                  : AppColors.border,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: isMe
                                ? CrossAxisAlignment.end
                                : CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg.message,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isMe
                                      ? Colors.white
                                      : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                AppDateUtils.formatTime(msg.timestamp),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isMe
                                      ? Colors.white70
                                      : AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(child: Text('Error: $err')),
              ),
            ),

            // Text Input bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Type your message...',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.send_rounded,
                      color: AppColors.primary,
                    ),
                    onPressed: _sendMessage,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
