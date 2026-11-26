import 'package:flutter/foundation.dart';

/// Estado de um bloco do Início, carregado de forma independente dos demais.
///
/// Com dados na tela, [load] atualiza em silêncio e uma falha os mantém. Sem
/// dados, mostra carregamento e, se falhar, [error]. Respostas antigas são
/// descartadas.
class HomeBlock<T> extends ChangeNotifier {
  HomeBlock({required this.fetch, required this.errorMessage});

  final Future<T> Function() fetch;
  final String Function(Object error) errorMessage;

  T? _data;
  String? _error;
  int _request = 0;
  bool _disposed = false;

  T? get data => _data;
  String? get error => _error;
  bool get isLoading => _data == null && _error == null;

  Future<void> load() async {
    final request = ++_request;
    if (_data == null && _error != null) {
      _error = null;
      notifyListeners();
    }
    try {
      final result = await fetch();
      if (_disposed || request != _request) return;
      _data = result;
      _error = null;
    } catch (err) {
      if (_disposed || request != _request) return;
      if (_data == null) _error = errorMessage(err);
    }
    notifyListeners();
  }

  /// Aplica um resultado já confirmado pelo backend, descartando cargas em voo.
  void set(T value) {
    _request++;
    _data = value;
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
