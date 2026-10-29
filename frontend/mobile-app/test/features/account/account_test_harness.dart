import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:provider/provider.dart';

/// Registra as requisições recebidas e responde via [handler].
class RecordingHttp {
  RecordingHttp(this.handler);

  final Future<http.Response> Function(http.Request) handler;
  final List<http.Request> requests = [];

  ApiClient client({String? token}) {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) {
        requests.add(request);
        return handler(request);
      }),
    );
    if (token != null) api.setAuthToken(token);
    return api;
  }
}

http.Response jsonResponse(Object body, int status) => http.Response(jsonEncode(body), status);

/// Monta [home] dentro de um app com [ApiClient] disponível via Provider.
Future<void> pumpWithApi(WidgetTester tester, ApiClient api, Widget home) async {
  // Viewport alto o bastante para que formulários longos não saiam da tela.
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    Provider<ApiClient>.value(value: api, child: MaterialApp(home: home)),
  );
}

Completer<http.Response> pendingResponse() => Completer<http.Response>();
