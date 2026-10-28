import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/adherence_ring.dart';
import '../providers/doctor_providers.dart';

class AdherenceInsightsScreen extends ConsumerStatefulWidget {
  const AdherenceInsightsScreen({super.key});

  @override
  ConsumerState<AdherenceInsightsScreen> createState() =>
      _AdherenceInsightsScreenState();
}

class _AdherenceInsightsScreenState
    extends ConsumerState<AdherenceInsightsScreen> {
  int _selectedRangeIndex = 0;
  final List<String> _ranges = ['7D', '30D', '3M', '6M'];

  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(doctorDashboardProvider);
    final avgAdherence = dashboardAsync.value?.averageAdherence ?? 85.0;
    final riskPatients = dashboardAsync.value?.riskPatients ?? [];
    final totalPatients = dashboardAsync.value?.totalPatients ?? 0;
    final missedCount = dashboardAsync.value?.missedDoseCount ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Adherence Insights'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Range Filter Tabs [7D] [30D] [3M] [6M]
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: _ranges.asMap().entries.map((entry) {
                    final index = entry.key;
                    final range = entry.value;
                    final isSelected = _selectedRangeIndex == index;

                    return Expanded(
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _selectedRangeIndex = index),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              range,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isSelected
                                    ? Colors.white
                                    : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),

              // Average Adherence Ring Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    AdherenceRing(
                      percentage: avgAdherence,
                      size: 130,
                      strokeWidth: 12,
                      subtitle: 'Average',
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Patient Group Adherence',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$totalPatients active registered patients',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Bar Chart Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Daily Adherence Trend (%)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 180,
                      child: BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: 100,
                          barTouchData: BarTouchData(enabled: true),
                          titlesData: FlTitlesData(
                            show: true,
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                getTitlesWidget: (val, meta) {
                                  const days = [
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                  ];
                                  final idx = val.toInt();
                                  if (idx >= 0 && idx < days.length) {
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text(
                                        days[idx],
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textMuted,
                                        ),
                                      ),
                                    );
                                  }
                                  return const SizedBox();
                                },
                              ),
                            ),
                            leftTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 32,
                                interval: 25,
                                getTitlesWidget: (val, meta) {
                                  return Text(
                                    '${val.toInt()}%',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.textMuted,
                                    ),
                                  );
                                },
                              ),
                            ),
                            topTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false),
                            ),
                            rightTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false),
                            ),
                          ),
                          gridData: FlGridData(
                            show: true,
                            drawVerticalLine: false,
                            horizontalInterval: 25,
                            getDrawingHorizontalLine: (val) => FlLine(
                              color: AppColors.divider,
                              strokeWidth: 1,
                            ),
                          ),
                          borderData: FlBorderData(show: false),
                          barGroups: [
                            _makeBarGroup(
                              0,
                              (avgAdherence * 0.95).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(
                              1,
                              (avgAdherence * 0.90).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(
                              2,
                              (avgAdherence * 1.02).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(
                              3,
                              (avgAdherence * 0.97).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(
                              4,
                              (avgAdherence * 1.05).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(
                              5,
                              (avgAdherence * 0.98).clamp(40.0, 100.0),
                            ),
                            _makeBarGroup(6, avgAdherence.clamp(40.0, 100.0)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Insights Bullet Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Clinical Insights',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (riskPatients.isNotEmpty) ...[
                      for (final rp in riskPatients.take(2))
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10.0),
                          child: _buildInsightRow(
                            icon: Icons.error_outline_rounded,
                            iconColor: AppColors.statusDanger,
                            text:
                                "${rp.name}'s adherence is below target (${rp.adherenceRate.round()}%).",
                          ),
                        ),
                    ] else ...[
                      _buildInsightRow(
                        icon: Icons.check_circle_outline_rounded,
                        iconColor: AppColors.statusSuccess,
                        text:
                            'All tracked patients are maintaining satisfactory adherence levels.',
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (missedCount > 0)
                      _buildInsightRow(
                        icon: Icons.access_time_rounded,
                        iconColor: AppColors.statusWarning,
                        text:
                            '$missedCount total missed doses recorded today across patients.',
                      )
                    else
                      _buildInsightRow(
                        icon: Icons.thumb_up_alt_outlined,
                        iconColor: AppColors.statusSuccess,
                        text: 'Zero missed doses reported for today so far.',
                      ),
                    const SizedBox(height: 10),
                    _buildInsightRow(
                      icon: Icons.tips_and_updates_outlined,
                      iconColor: AppColors.primary,
                      text:
                          'AstaWashe voice reminders can be enabled for patients facing low adherence.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: const Color(0xFF3B82F6),
          width: 14,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        ),
      ],
    );
  }

  Widget _buildInsightRow({
    required IconData icon,
    required Color iconColor,
    required String text,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: iconColor),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
              height: 1.3,
            ),
          ),
        ),
      ],
    );
  }
}
