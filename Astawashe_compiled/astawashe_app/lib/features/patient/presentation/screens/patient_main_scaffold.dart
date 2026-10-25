import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/realtime/realtime_service.dart';
import 'patient_home_screen.dart';
import 'medication_schedule_screen.dart';
import 'patient_history_screen.dart';
import 'patient_profile_screen.dart';

class PatientMainScaffold extends StatefulWidget {
  final int initialIndex;

  const PatientMainScaffold({super.key, this.initialIndex = 0});

  @override
  State<PatientMainScaffold> createState() => _PatientMainScaffoldState();
}

class _PatientMainScaffoldState extends State<PatientMainScaffold> {
  late int _currentIndex;

  final List<Widget> _screens = const [
    PatientHomeScreen(),
    MedicationScheduleScreen(),
    PatientHistoryScreen(),
    PatientProfileScreen(),
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
        selectedItemColor: AppColors.primary,
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
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_month_rounded),
            label: 'Schedule',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_rounded),
            activeIcon: Icon(Icons.history_toggle_off_rounded),
            label: 'History',
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
