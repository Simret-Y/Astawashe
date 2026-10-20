import 'package:flutter/material.dart';

import 'services/api_service.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const AstaWasheApp());
}

class AstaWasheApp extends StatelessWidget {
  const AstaWasheApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AstaWashe',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4169A1)),
        scaffoldBackgroundColor: const Color(0xFFF7F9FC),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();

  bool _isChecking = false;
  String _connectionMessage = 'Not checked yet';
  bool? _isConnected;

  Future<void> _checkConnection() async {
    setState(() {
      _isChecking = true;
      _connectionMessage = 'Connecting to server...';
      _isConnected = null;
    });

    try {
      final response = await _apiService.checkHealth();

      if (!mounted) return;

      setState(() {
        _isConnected = response.statusCode >= 200 && response.statusCode < 300;

        _connectionMessage = _isConnected!
            ? 'Backend connection successful!'
            : 'Server responded with status ${response.statusCode}.';
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _isConnected = false;
        _connectionMessage =
            'Could not connect. Check that the backend is running.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isChecking = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AstaWashe',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFF7F9FC),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
            child: const Text('Sign in'),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.health_and_safety_outlined,
                  size: 64,
                  color: Color(0xFF4169A1),
                ),
                const SizedBox(height: 24),
                Text(
                  'Smart Healthcare Starts With Every Dose',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Your medication reminders and health assistance, '
                  'designed with accessibility in mind.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.black54,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                Card(
                  elevation: 0,
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Backend connection',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              _isConnected == null
                                  ? Icons.info_outline
                                  : _isConnected!
                                  ? Icons.check_circle_outline
                                  : Icons.error_outline,
                              color: _isConnected == null
                                  ? Colors.grey
                                  : _isConnected!
                                  ? Colors.green
                                  : Colors.red,
                            ),
                            const SizedBox(width: 10),
                            Expanded(child: Text(_connectionMessage)),
                          ],
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: _isChecking ? null : _checkConnection,
                            icon: _isChecking
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.wifi),
                            label: Text(
                              _isChecking
                                  ? 'Checking...'
                                  : 'Check server connection',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
