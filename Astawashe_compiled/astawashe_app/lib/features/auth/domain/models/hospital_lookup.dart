class HospitalLookup {
  final String id;
  final String name;
  final String? organizationType;
  final String? city;
  final String? region;
  final String? address;
  final String? phone;
  final String? email;

  const HospitalLookup({
    required this.id,
    required this.name,
    this.organizationType,
    this.city,
    this.region,
    this.address,
    this.phone,
    this.email,
  });

  factory HospitalLookup.fromJson(Map<String, dynamic> json) {
    return HospitalLookup(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Unnamed Hospital',
      organizationType: json['organizationType'] as String?,
      city: json['city'] as String?,
      region: json['region'] as String?,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
    );
  }
}

class DoctorLookup {
  final String id;
  final String name;
  final String? specialization;
  final String? experience;
  final String? status;

  const DoctorLookup({
    required this.id,
    required this.name,
    this.specialization,
    this.experience,
    this.status,
  });

  factory DoctorLookup.fromJson(Map<String, dynamic> json) {
    return DoctorLookup(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Doctor',
      specialization: json['specialization'] as String?,
      experience: json['experience'] as String?,
      status: json['status'] as String?,
    );
  }
}
