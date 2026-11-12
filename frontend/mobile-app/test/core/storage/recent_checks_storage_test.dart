import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/storage/recent_checks_storage.dart';

class _MemoryStore implements LocalKeyValueStore {
  final Map<String, String> data = {};

  @override
  Future<String?> read(String key) async => data[key];

  @override
  Future<void> write(String key, String value) async => data[key] = value;

  @override
  Future<void> delete(String key) async => data.remove(key);
}

class _BrokenStore implements LocalKeyValueStore {
  @override
  Future<String?> read(String key) async => throw StateError('indisponível');

  @override
  Future<void> write(String key, String value) async => throw StateError('indisponível');

  @override
  Future<void> delete(String key) async => throw StateError('indisponível');
}

void main() {
  late _MemoryStore store;
  late RecentChecksStorage storage;
  var tick = 0;

  setUp(() {
    store = _MemoryStore();
    tick = 0;
    storage = RecentChecksStorage(store: store, now: () => DateTime.utc(2026, 11, 2, 10, tick++));
  });

  test('lista vazia quando nada foi salvo', () async {
    expect(await storage.load('u1'), isEmpty);
  });

  test('salva e devolve do mais recente para o mais antigo', () async {
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: 'X'));
    await storage.save('u1', const RecentCheck(productId: 'b', productName: 'B', brand: 'Y'));

    final items = await storage.load('u1');

    expect(items.map((e) => e.productId), ['b', 'a']);
    expect(items.first.checkedAt, DateTime.utc(2026, 11, 2, 10, 1));
  });

  test('desduplica por productId e move para o topo', () async {
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: ''));
    await storage.save('u1', const RecentCheck(productId: 'b', productName: 'B', brand: ''));
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A2', brand: ''));

    final items = await storage.load('u1');

    expect(items.map((e) => e.productId), ['a', 'b']);
    expect(items.first.productName, 'A2');
  });

  test('mantém no máximo ${RecentChecksStorage.maxItems} itens', () async {
    for (var i = 0; i < RecentChecksStorage.maxItems + 3; i++) {
      await storage.save('u1', RecentCheck(productId: 'p$i', productName: 'P$i', brand: ''));
    }

    final items = await storage.load('u1');

    expect(items.length, RecentChecksStorage.maxItems);
    expect(items.first.productId, 'p${RecentChecksStorage.maxItems + 2}');
  });

  test('isola por usuário', () async {
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: ''));

    expect(await storage.load('u2'), isEmpty);
  });

  test('não persiste veredito (apenas id, nome, marca e data)', () async {
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: 'X'));

    final raw = store.data.values.single;

    expect(raw.toLowerCase(), isNot(contains('risk')));
    expect(raw.toLowerCase(), isNot(contains('compat')));
  });

  test('JSON corrompido vira lista vazia', () async {
    store.data['celilac_recent_checks_u1'] = '{nao-e-lista';
    expect(await storage.load('u1'), isEmpty);

    store.data['celilac_recent_checks_u1'] = '[1, {"productId": "ok", "productName": "N", "checkedAt": "2026-11-02T10:00:00Z"}]';
    expect((await storage.load('u1')).map((e) => e.productId), ['ok']);
  });

  test('armazenamento indisponível: load devolve vazio e save não lança', () async {
    final broken = RecentChecksStorage(store: _BrokenStore());

    expect(await broken.load('u1'), isEmpty);
    await broken.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: ''));
    await broken.clear('u1');
  });

  test('clear remove o histórico do usuário', () async {
    await storage.save('u1', const RecentCheck(productId: 'a', productName: 'A', brand: ''));
    await storage.clear('u1');
    expect(await storage.load('u1'), isEmpty);
  });
}
