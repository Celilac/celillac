import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/auth/consumer_role.dart';

void main() {
  group('isConsumerRole', () {
    test('only CELIACO is a consumer', () {
      expect(isConsumerRole('CELIACO'), isTrue);
      expect(isConsumerRole('PARCEIRO'), isFalse);
      expect(isConsumerRole('ADMIN'), isFalse);
    });

    test('unknown or empty roles are rejected (fail closed)', () {
      expect(isConsumerRole(''), isFalse);
      expect(isConsumerRole('celiaco'), isFalse);
      expect(isConsumerRole('SOMETHING_NEW'), isFalse);
    });
  });
}
