import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/core/links/external_link_launcher.dart';
import 'package:mobile_app/core/auth/session_controller.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';
import 'package:provider/provider.dart';

import '../catalog/discovery_test_harness.dart';

/// Lançador simulado: registra os links e devolve [result].
class FakeLauncher extends ExternalLinkLauncher {
  FakeLauncher({this.result = true}) : super(launch: (_) async => true);

  final bool result;
  final List<Uri> opened = [];

  @override
  Future<bool> open(Uri uri) async {
    opened.add(uri);
    return result;
  }
}

Future<void> pumpPartners(
  WidgetTester tester, {
  required ApiClient api,
  required Widget home,
  ExternalLinkLauncher? launcher,
}) async {
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<RecentChecksStorage>.value(value: RecentChecksStorage(store: MemoryKeyValueStore())),
        Provider<ExternalLinkLauncher>.value(value: launcher ?? FakeLauncher()),
        ChangeNotifierProvider<SessionController>(create: (_) => FakeSession()),
      ],
      child: MaterialApp(home: home),
    ),
  );
}

Map<String, dynamic> partnerJson({
  String id = 'pt1',
  String name = 'Cantina Sem Glúten',
  String status = 'ACTIVE',
  String legalNature = 'PJ',
  String type = 'RESTAURANT',
  String? city = 'São Paulo',
  String? phone = '(11) 99999-8888',
  String? address = 'Av. Paulista, 1000',
}) =>
    {
      'id': id,
      'userId': 'owner-secret',
      'name': name,
      'cnpj': '12.345.678/0001-95',
      'legalNature': legalNature,
      'documentNumber': '12.345.678/0001-95',
      'documentType': 'CNPJ',
      'companyName': 'Razão Social Secreta LTDA',
      'responsibleName': 'Responsável Secreto',
      'description': 'Pratos sem contaminação cruzada.',
      'address': address,
      'phone': phone,
      'type': type,
      'approvalStatus': 'APPROVED',
      'operationalStatus': status,
      'city': city,
      'state': 'SP',
      'deliveryRegion': 'Grande SP',
    };

Map<String, dynamic> reviewJson({String id = 'r1', int rating = 4, String? comment = 'Atendimento ótimo'}) => {
      'id': id,
      'userId': 'u9',
      'partnerId': 'pt1',
      'rating': rating,
      'comment': comment,
      'createdAt': '2026-01-02T10:00:00Z',
    };
