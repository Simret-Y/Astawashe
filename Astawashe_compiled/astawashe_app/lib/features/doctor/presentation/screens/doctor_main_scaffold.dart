import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/realtime/realtime_service.dart';
import 'doctor_home_screen.dart';
import 'patient_list_screen.dart';
import 'doctor_messages_screen.dart';
import 'doctor_profile_screen.dart';

class DoctorMainScaffold extends StatefulWidget {
  final int initialIndex;

  const DoctorMainScaffold({super.key, this.initialIndex = 0});

  @override
  State<DoctorMainScaffold> createState() => _DoctorMainScaffoldState();
}

class _DoctorMainScaffoldState extends State<DoctorMainScaffold> {
  late int _currentIndex;

  final List<Widget> _screens = const [
    DoctorHomeScreen(),
    PatientListScreen(),
    DoctorMessagesScreen(),
    DoctorProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const RealtimeStatusBanner(),
            Expanded(
              child: IndexedStack(index: _currentIndex, children: _screens),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.doctorNavy,
        unselectedItemColor: AppColors.textMuted,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 11,
        ),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 11,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline_rounded),
            activeIcon: Icon(Icons.people_rounded),
            label: 'Patients',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            activeIcon: Icon(Icons.chat_bubble_rounded),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            activeIcon: Icon(Icons.grid_view_sharp),
            label: 'More',
          ),
        ],
      ),
    );
  }
}
