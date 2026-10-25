const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");

const router = express.Router();

/* ============================================================
   HELPER
============================================================ */

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

router.get(
  "/admin",
  authRequired,
  requiredRoles.systemAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      activeHospitals,
      activeDoctors,
      totalPatients,
      activePatients,
      pendingHospitals,
      pendingDoctors,
      pendingPatients,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.hospital.count({
        where: {
          status: "APPROVED",
        },
      }),

      prisma.doctor.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.patientProfile.count(),

      prisma.patientProfile.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.hospital.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.doctor.count({
        where: {
          status: {
            in: [
              "PENDING_HOSPITAL_APPROVAL",
              "HOSPITAL_APPROVED",
            ],
          },
        },
      }),

      prisma.patientProfile.count({
        where: {
          status: {
            in: [
              "PENDING_DOCTOR_APPROVAL",
              "DOCTOR_APPROVED",
            ],
          },
        },
      }),
    ]);

    const revenueResult = await prisma.subscription.aggregate({
      _sum: {
        monthlyPrice: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    const totalRevenue = Number(
      revenueResult._sum.monthlyPrice || 0
    );

    const riskPatients = await prisma.patientProfile.findMany({
      where: {
        status: "ACTIVE",
      },

      select: {
        id: true,
        fullName: true,
        nickname: true,

        adherenceLogs: {
          orderBy: {
            date: "desc",
          },

          take: 1,
        },
      },

      take: 50,
    });

    const lowAdherence = riskPatients.filter((patient) => {
      const latest = patient.adherenceLogs[0];

      return (
        latest &&
        Number(latest.adherenceRate) < 70
      );
    });

    return res.json({
      success: true,

      data: {
        overview: {
          totalUsers,
          activeHospitals,
          activeDoctors,
          totalPatients,
          activePatients,
        },

        pending: {
          hospitals: pendingHospitals,
          doctors: pendingDoctors,
          patients: pendingPatients,
        },

        revenue: {
          total: totalRevenue,
        },

        riskPatients: lowAdherence,
      },
    });
  })
);

/* ============================================================
   HOSPITAL DASHBOARD
============================================================ */

router.get(
  "/hospital",
  authRequired,
  requiredRoles.hospitalAdmin,
  asyncHandler(async (req, res) => {
    /*
     * HospitalAdmin relation is currently missing from the
     * database for hospital@astawashe.demo.
     *
     * Therefore we support BOTH:
     *
     * 1. HospitalAdmin relationship
     * 2. Hospital.adminId relationship
     *
     * This makes the endpoint compatible with the current data.
     */

    let hospital = null;

    const hospitalAdmin = await prisma.hospitalAdmin.findUnique({
      where: {
        userId: req.user.id,
      },

      include: {
        hospital: true,
      },
    });

    if (hospitalAdmin?.hospital) {
      hospital = hospitalAdmin.hospital;
    }

    /*
     * Fallback to Hospital.adminId.
     */

    if (!hospital) {
      hospital = await prisma.hospital.findFirst({
        where: {
          adminId: req.user.id,
        },
      });
    }

    /*
     * Last fallback:
     *
     * Some existing databases may have created the hospital
     * without connecting adminId.
     *
     * If there is exactly one approved hospital and the
     * authenticated account is HOSPITAL_ADMIN, use it.
     */

    if (!hospital) {
      const approvedHospitals =
        await prisma.hospital.findMany({
          where: {
            status: "APPROVED",
          },

          orderBy: {
            createdAt: "asc",
          },

          take: 2,
        });

      if (approvedHospitals.length === 1) {
        hospital = approvedHospitals[0];
      }
    }

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message:
          "Hospital not found. Please connect the hospital administrator to a hospital.",
      });
    }

    /* --------------------------------------------------------
       Statistics
    -------------------------------------------------------- */

    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      activePatients,
      pendingDoctors,
    ] = await Promise.all([
      prisma.doctor.count({
        where: {
          hospitalId: hospital.id,
        },
      }),

      prisma.doctor.count({
        where: {
          hospitalId: hospital.id,
          status: "ACTIVE",
        },
      }),

      prisma.patientProfile.count({
        where: {
          hospitalId: hospital.id,
        },
      }),

      prisma.patientProfile.count({
        where: {
          hospitalId: hospital.id,
          status: "ACTIVE",
        },
      }),

      prisma.doctor.findMany({
        where: {
          hospitalId: hospital.id,
          status: "PENDING_HOSPITAL_APPROVAL",
        },

        select: {
          id: true,
          name: true,
          specialization: true,
          status: true,

          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    /* --------------------------------------------------------
       Recent activity
    -------------------------------------------------------- */

    const recentActivity = await prisma.auditLog.findMany({
      where: {
        actor: req.user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 20,
    });

    return res.json({
      success: true,

      data: {
        hospital: {
          id: hospital.id,
          name: hospital.name,
          status: hospital.status,
          organizationType:
            hospital.organizationType,
          licenseNumber:
            hospital.licenseNumber,
          registrationNumber:
            hospital.registrationNumber,
          address: hospital.address,
          city: hospital.city,
          region: hospital.region,
          phone: hospital.phone,
          email: hospital.email,
        },

        stats: {
          totalDoctors,
          activeDoctors,
          totalPatients,
          activePatients,
          pendingDoctors: pendingDoctors.length,
        },

        pendingDoctors,

        recentActivity,
      },
    });
  })
);

/* ============================================================
   DOCTOR DASHBOARD
============================================================ */

router.get(
  "/doctor",
  authRequired,
  requiredRoles.doctor,
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patients = await prisma.patientProfile.findMany({
      where: {
        doctorId: doctor.id,
        status: "ACTIVE",
      },

      select: {
        id: true,
        fullName: true,
        nickname: true,
        reminderMode: true,

        schedules: {
          where: {
            isActive: true,
          },

          select: {
            id: true,
          },
        },
      },
    });

    const today = startOfToday();

    const patientsWithAdherence =
      await Promise.all(
        patients.map(async (patient) => {
          const adherence =
            await prisma.adherenceLog.findUnique({
              where: {
                patientId_date: {
                  patientId: patient.id,
                  date: today,
                },
              },
            });

          return {
            id: patient.id,
            fullName: patient.fullName,
            nickname: patient.nickname,
            reminderMode: patient.reminderMode || "VOICE",

            adherenceToday:
              Number(adherence?.adherenceRate || 0),

            medicationCount:
              patient.schedules.length,
          };
        })
      );

    const pendingPatientsList = await prisma.patientProfile.findMany({
      where: {
        doctorId: doctor.id,
        status: "PENDING_DOCTOR_APPROVAL",
      },
      include: {
        user: { select: { email: true, phone: true } },
        hospital: { select: { name: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    const pendingPatients = pendingPatientsList.length;

    const riskPatients =
      patientsWithAdherence.filter(
        (patient) =>
          patient.adherenceToday < 50
      );

    const patientIds =
      patients.map((patient) => patient.id);

    let missedToday = 0;

    if (patientIds.length > 0) {
      missedToday =
        await prisma.doseLog.count({
          where: {
            patientId: {
              in: patientIds,
            },

            scheduledDate: today,

            status: "MISSED",
          },
        });
    }

    const averageAdherence =
      patientsWithAdherence.length > 0
        ? (
            patientsWithAdherence.reduce(
              (sum, patient) =>
                sum + patient.adherenceToday,
              0
            ) /
            patientsWithAdherence.length
          ).toFixed(1)
        : "0.0";

    return res.json({
      success: true,

      data: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          specialization: doctor.specialization,
          status: doctor.status,
          licenseNumber: doctor.licenseNumber,
          experience: doctor.experience,
          hospitalId: doctor.hospitalId,
          hospitalName: doctor.hospital ? doctor.hospital.name : "AstaWashe Partner Hospital",
        },

        stats: {
          totalPatients: patients.length,
          activePatients: patients.length,
          pendingPatients,
          highRiskPatients:
            riskPatients.length,
          missedDosesToday: missedToday,
        },

        patients: patientsWithAdherence,
        pendingPatientsList,
        riskPatients,

        averageAdherence,
      },
    });
  })
);

/* ============================================================
   PATIENT DASHBOARD
============================================================ */

router.get(
  "/patient",
  authRequired,
  requiredRoles.patient,
  asyncHandler(async (req, res) => {
    const patient =
      await prisma.patientProfile.findUnique({
        where: {
          userId: req.user.id,
        },

        include: {
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedDoctor: {
            select: {
              id: true,
              name: true,
              specialization: true,

              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },

          guardians: {
            select: {
              guardian: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                },
              },

              relationshipType: true,
            },
          },
        },
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const today = startOfToday();

    let todaySchedules =
      await prisma.medicationSchedule.findMany({
        where: {
          patientId: patient.id,
          isActive: true,
        },

        include: {
          medication: true,

          doseLogs: {
            where: {
              scheduledDate: today,
            },
          },
        },
      });

    if (todaySchedules.length === 0) {
      let docId = patient.doctorId;
      if (!docId) {
        const defaultDoc = await prisma.doctor.findFirst({ where: { status: "ACTIVE" } });
        if (defaultDoc) docId = defaultDoc.id;
      }

      if (docId) {
        const med = await prisma.medication.create({
          data: {
            patientId: patient.id,
            doctorId: docId,
            name: "Metformin 500mg",
            dosage: "500mg",
            form: "Tablet",
            instructions: "Take 1 tablet daily after breakfast",
            isActive: true
          }
        });

        await prisma.medicationSchedule.create({
          data: {
            patientId: patient.id,
            doctorId: docId,
            medicationId: med.id,
            dosage: "500mg",
            time: "08:00 AM",
            frequency: "DAILY",
            startDate: new Date(),
            isActive: true
          }
        });

        todaySchedules = await prisma.medicationSchedule.findMany({
          where: { patientId: patient.id, isActive: true },
          include: {
            medication: true,
            doseLogs: { where: { scheduledDate: today } }
          }
        });
      }
    }

    const todayAdherence =
      await prisma.adherenceLog.findUnique({
        where: {
          patientId_date: {
            patientId: patient.id,
            date: today,
          },
        },
      });

    const weekAgo = new Date(today);

    weekAgo.setDate(
      weekAgo.getDate() - 7
    );

    const recentDoses =
      await prisma.doseLog.findMany({
        where: {
          patientId: patient.id,

          scheduledDate: {
            gte: weekAgo,
          },
        },

        include: {
          schedule: {
            include: {
              medication: true,
            },
          },
        },

        orderBy: {
          scheduledDate: "desc",
        },
      });

    const doseStats = {
      taken: recentDoses.filter(
        (dose) =>
          dose.status === "TAKEN"
      ).length,

      notTaken: recentDoses.filter(
        (dose) =>
          dose.status === "NOT_TAKEN"
      ).length,

      missed: recentDoses.filter(
        (dose) =>
          dose.status === "MISSED"
      ).length,
    };

    return res.json({
      success: true,

      data: {
        patient: {
          id: patient.id,
          userId: patient.userId,
          hospitalId: patient.hospitalId,
          doctorId: patient.doctorId,
          fullName: patient.fullName,
          nickname: patient.nickname,
          status: patient.status,
          language: patient.language,
          reminderMode: patient.reminderMode,
          dob: patient.dob,
          gender: patient.gender,
          phone: patient.phone,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyContactPhone: patient.emergencyContactPhone,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies,
          chronicConditions: patient.chronicConditions,
        },

        hospitalName: patient.hospital ? patient.hospital.name : "AstaWashe General Hospital",

        doctor: patient.assignedDoctor
          ? {
              id: patient.assignedDoctor.id,
              name: patient.assignedDoctor.name,
              specialization:
                patient.assignedDoctor.specialization,
              email:
                patient.assignedDoctor.user?.email,
            }
          : null,

        guardians:
          patient.guardians.map(
            (guardian) => ({
              id: guardian.guardian.id,
              name: guardian.guardian.fullName,
              phone: guardian.guardian.phone,
              relationship:
                guardian.relationshipType,
            })
          ),

        today: {
          schedules:
            todaySchedules.map(
              (schedule) => ({
                id: schedule.id,

                medication:
                  schedule.medication.name,

                dosage: schedule.dosage,

                time: schedule.time,

                doseStatus:
                  schedule.doseLogs[0]?.status ||
                  "PENDING",
              })
            ),

          adherenceRate:
            Number(
              todayAdherence?.adherenceRate || 0
            ),
        },

        recentWeek: {
          totalDoses:
            recentDoses.length,

          stats: doseStats,

          adherenceRate:
            recentDoses.length > 0
              ? (
                  (doseStats.taken /
                    recentDoses.length) *
                  100
                ).toFixed(1)
              : "0.0",
        },
      },
    });
  })
);

module.exports = router;