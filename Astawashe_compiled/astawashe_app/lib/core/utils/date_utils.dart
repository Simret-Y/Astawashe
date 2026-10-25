import 'package:intl/intl.dart';

/// App date and time formatting utilities.
class AppDateUtils {
  AppDateUtils._();

  static String formatHeaderDate(DateTime date) {
    return DateFormat('EEEE, MMM d').format(date);
  }

  static String formatShortDate(DateTime date) {
    return DateFormat('MMM d').format(date);
  }

  static String formatDayOfWeek(DateTime date) {
    return DateFormat('E').format(date); // Mon, Tue, etc.
  }

  static String formatDayOfMonth(DateTime date) {
    return DateFormat('d').format(date); // 13, 14, etc.
  }

  static String formatTime(DateTime time) {
    return DateFormat('hh:mm a').format(time); // 10:00 AM
  }

  static bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  static List<DateTime> getWeekDates(DateTime anchor) {
    // Return Monday through Sunday of current week
    final monday = anchor.subtract(Duration(days: anchor.weekday - 1));
    return List.generate(7, (index) => monday.add(Duration(days: index)));
  }
}
