import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models/partner_models.dart';
import '../../core/theme/app_colors.dart';
import 'partner_details_screen.dart';
import 'partner_error_messages.dart';
import 'partner_labels.dart';
import 'widgets/partner_logo.dart';

enum _Status { loading, error, loaded }

/// Lista pública de parceiros (`GET /partners`). A API não tem filtros nem
/// paginação; a busca por texto abaixo é só de exibição (nome, cidade e
/// descrição, como no web) e nunca decide segurança alimentar.
class PartnersScreen extends StatefulWidget {
  const PartnersScreen({super.key});

  @override
  State<PartnersScreen> createState() => _PartnersScreenState();
}

class _PartnersScreenState extends State<PartnersScreen> {
  _Status _status = _Status.loading;
  String? _error;
  List<PublicPartner> _partners = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    setState(() {
      _status = _Status.loading;
      _error = null;
    });
    try {
      final partners = await api.getPublicPartners();
      if (!mounted) return;
      setState(() {
        _partners = partners;
        _status = _Status.loaded;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _error = PartnerErrorMessages.list(err);
        _status = _Status.error;
      });
    }
  }

  List<PublicPartner> get _filtered {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return _partners;
    return _partners
        .where((p) =>
            p.name.toLowerCase().contains(q) ||
            (p.city?.toLowerCase().contains(q) ?? false) ||
            (p.description?.toLowerCase().contains(q) ?? false))
        .toList();
  }

  void _open(PublicPartner partner) {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (_) => PartnerDetailsScreen(partnerId: partner.id, partnerName: partner.name),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parceiros')),
      body: SafeArea(child: _body()),
    );
  }

  Widget _body() {
    switch (_status) {
      case _Status.loading:
        return const Center(key: Key('partners-loading'), child: CircularProgressIndicator(color: AppColors.primary));
      case _Status.error:
        return Center(
          key: const Key('partners-error'),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _error ?? PartnerErrorMessages.list(Object()),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  key: const Key('partners-retry'),
                  onPressed: _load,
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        );
      case _Status.loaded:
        return _loaded();
    }
  }

  Widget _loaded() {
    if (_partners.isEmpty) {
      return const Center(
        key: Key('partners-empty'),
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Nenhum parceiro disponível no momento.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMutedLight),
          ),
        ),
      );
    }
    final items = _filtered;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            key: const Key('partners-search'),
            onChanged: (value) => setState(() => _query = value),
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Buscar por nome, cidade ou descrição',
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: items.isEmpty
                ? ListView(
                    children: const [
                      Padding(
                        key: Key('partners-no-match'),
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'Nenhum parceiro encontrado para essa busca.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textMutedLight),
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _PartnerCard(partner: items[i], onTap: () => _open(items[i])),
                  ),
          ),
        ),
      ],
    );
  }
}

class _PartnerCard extends StatelessWidget {
  const _PartnerCard({required this.partner, required this.onTap});

  final PublicPartner partner;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final nature = PartnerLabels.legalNature(partner.legalNature);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PartnerLogo(logoUrl: partner.logoUrl),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    partner.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${PartnerLabels.type(partner.type)} · ${PartnerLabels.cityState(partner.city, partner.state)}',
                    style: const TextStyle(fontSize: 13, color: AppColors.textMutedLight),
                  ),
                  if (nature != null) ...[
                    const SizedBox(height: 4),
                    Text(nature, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  ],
                  if (partner.isTemporarilyClosed) ...[
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 16, color: AppColors.severityMedium),
                        SizedBox(width: 4),
                        Text(
                          'Temporariamente fechado',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.severityMedium),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
