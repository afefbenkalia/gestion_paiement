// lib/pdf-generator.js
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import writtenNumber from 'written-number';

writtenNumber.defaults.lang = 'fr';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 8,
  },
  headerSection: {
    width: '100%',
    paddingBottom: 6,
    marginBottom: 10,
  },
  // Styles de tableau unifiés
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
  },
  tableCol: {
    width: '25%', // 100% / 4 colonnes = 25%
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableColFive: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  // Style pour le tableau montants (6 colonnes)
  tableColHeader: {
    width: '16.66%', // 100% / 6 colonnes = 16.66%
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  // Style pour le tableau avec 3 colonnes
  tableColThree: {
    width: '33.33%', // 100% / 3 colonnes = 33.33%
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableColTwoThirds: {
    width: '66.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableColSeven: {
    width: '14.2857%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableColTen: {
    width: '10%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableColEight: {
    width: '12.5%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    minHeight: 30,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
    padding: 5,
    textAlign: 'center',
    width: '100%',
    wordBreak: 'break-all',
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
  },
  tableHeader: {
    fontFamily: 'Helvetica-Bold',
  },
  // Styles pour les autres composants
  infoGrid: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 150,
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  value: {
    fontSize: 10,
    marginRight: 12,
  },
  memoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memoNumber: {
    fontSize: 10,
  },
  memoDate: {
    fontSize: 10,
  },
  documentHeaderContainer: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentHeaderTitleBox: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  documentHeaderTitleText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  documentHeaderMetaSmall: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
    width: 80,
  },
  documentHeaderMetaSmallLine: {
    fontSize: 7,
  },
});

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const amountToWords = (amount) => {
  try {
    const dinars = Math.floor(amount);
    const millimes = Math.round((amount - dinars) * 1000);
    let result = `${writtenNumber(dinars)} dinars`;
    if (millimes > 0) {
      result += ` et ${writtenNumber(millimes)} millimes`;
    }
    return result.charAt(0).toUpperCase() + result.slice(1);
  } catch (error) {
    return 'Montant non convertible';
  }
};

const formatRib = (rib) => {
  try {
    if (!rib) return '';
    const clean = String(rib).replace(/\s+/g, '');
    // Group digits in blocks of 4 with spaces to enable wrapping
    return clean.replace(/(.{4})/g, '$1 ').trim();
  } catch {
    return String(rib || '');
  }
};

const renderDocumentHeader = (title) => (
  <View style={styles.documentHeaderContainer}>
    <View style={styles.documentHeaderTitleBox}>
      <Text style={styles.documentHeaderTitleText}>{title}</Text>
    </View>
    <View style={styles.documentHeaderMetaSmall}>
      <Text style={styles.documentHeaderMetaSmallLine}>Réf :</Text>
      <Text style={styles.documentHeaderMetaSmallLine}>Version : </Text>
      <Text style={styles.documentHeaderMetaSmallLine}>Date d'application :</Text>
      <Text style={styles.documentHeaderMetaSmallLine}>
        {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </Text>
    </View>
  </View>
);

export async function generateFormationPDF(session, fiche, formateur) {
  const retenue = (fiche.montantBrut ?? 0) - (fiche.montantNet ?? 0);
  const periodeParts = (session.periode || '').split('au').map((part) => part.trim());
  const periodeStart = periodeParts[0] || '...............';
  const periodeEnd = periodeParts[1] || '...............';
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderDocumentHeader('MEMOIRE INDIVIDUELLE : FORMATION')}

        {/* Informations mémoire */}
        <View style={styles.memoInfo}>
          <Text style={styles.memoNumber}>
            <Text style={styles.label}>N° Mémoire :</Text> {fiche.numMemoire || '...............'}
          </Text>
          <Text style={styles.memoDate}>
            <Text style={styles.label}>Date Mémoire :</Text> {formatDate(fiche.updatedAt) || '...............'}
          </Text>
        </View>

        {/* Section certification */}
        <View style={[styles.section, styles.headerSection]}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Je soussigné(e) Mr (Mme)</Text>
            <Text style={styles.value}>{fiche.nomResponsable || '.............................'}</Text>
            <Text style={styles.label}>Fonction</Text>
            <Text style={styles.value}>.................................</Text>
            <Text style={styles.label}>De</Text>
            <Text style={styles.value}>........................................</Text>
            <Text>certifie que la formation relative a :</Text>
          </View>
        </View>

        {/* Informations formation */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Classe</Text>
            <Text style={styles.value}>{session.classe || '.............................'}</Text>
            <Text style={styles.label}>Spécialité</Text>
            <Text style={styles.value}>{session.specialite || '.............................'}</Text>
            <Text style={styles.label}>Promotion</Text>
            <Text style={styles.value}>{session.promotion || '.............................'}</Text>
            <Text style={styles.label}>Niveau</Text>
            <Text style={styles.value}>{session.niveau || '..................................'}</Text>
            <Text style={styles.label}>Semestre</Text>
            <Text style={styles.value}>{session.semestre || '....................................'}</Text>
          </View>
          
          <View style={styles.inlineRow}>
            <Text style={styles.label}>durant la période : Du</Text>
            <Text style={styles.value}>{periodeStart}</Text>
            <Text style={styles.label}>Au</Text>
            <Text style={styles.value}>{periodeEnd}</Text>
          </View>
          
        </View>

        {/* Tableau formateur - CORRIGÉ */}
        <View style={styles.section}>
          <Text>A été effectuée par l'enseignant(e) :</Text>

          <View style={styles.table}>
            {/* En-tête du tableau formateur */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Nom et Prénom</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>N° CIN</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>RIB</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Banque</Text>
              </View>
            </View>
            {/* Ligne de données du tableau formateur */}
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formateur?.name || '-'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formateur?.cin || '-'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formateur?.rib || '-'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formateur?.banque || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tableau montants - CORRIGÉ */}
        <View style={styles.section}>
          <Text>Et ce selon les informations ci-dessous :</Text>
          <View style={styles.table}>
            {/* En-tête du tableau montants */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Total regroupement</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Total tutorat</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Total heures</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Montant Brut</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Retenue</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>Montant Net</Text>
              </View>
            </View>
            {/* Ligne de données du tableau montants */}
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(fiche.totalRegroupement ?? 0).toString()}</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(fiche.totalTutorat ?? 0).toString()}</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(fiche.totalHeures ?? 0).toString()}</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(fiche.montantBrut ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(retenue ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCell}>{(fiche.montantNet ?? 0).toFixed(3)} TND</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Montant en toutes lettres</Text>
              </View>
              <View style={styles.tableColTwoThirds}>
                <Text style={styles.tableCell}>{amountToWords(fiche.montantBrut ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.section}><Text>Visa et Cachet du directeur de l'établissement : ................</Text></View>
          <View style={styles.section}><Text>Signature de l'enseignant(e)/formateur :..............</Text></View>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}

// Fonction pour la coordination - CORRIGÉE
export async function generateCoordinationPDF(session, fiche, coordinateur) {
  const retenue = (fiche.montantBrut ?? 0) - (fiche.montantNet ?? 0);
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderDocumentHeader('MEMOIRE INDIVIDUELLE : COORDINATION')}

        {/* Informations mémoire */}
        <View style={styles.memoInfo}>
          <Text style={styles.memoNumber}>
            <Text style={styles.label}>N° Mémoire :</Text> {fiche.numMemoire || '...............'}
          </Text>
          <Text style={styles.memoDate}>
            <Text style={styles.label}>Date Mémoire :</Text> {formatDate(fiche.updatedAt) || '...............'}
          </Text>
        </View>

        {/* Section certification */}
        <View style={[styles.section, styles.headerSection]}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Je soussigné(e) Mr (Mme)</Text>
            <Text style={styles.value}>{fiche.nomResponsable || '.............................'}</Text>
            <Text style={styles.label}>Fonction</Text>
            <Text style={styles.value}>.................................</Text>
            <Text style={styles.label}>De</Text>
            <Text style={styles.value}>........................................</Text>
            <Text>certifie que la coordination relative a :</Text>
          </View>
        </View>

        {/* Informations formation */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Classe</Text>
            <Text style={styles.value}>{session.classe || '.............................'}</Text>
            <Text style={styles.label}>Spécialité</Text>
            <Text style={styles.value}>{session.specialite || '.............................'}</Text>
            <Text style={styles.label}>Promotion</Text>
            <Text style={styles.value}>{session.promotion || '.............................'}</Text>
            <Text style={styles.label}>Niveau</Text>
            <Text style={styles.value}>{session.niveau || '..................................'}</Text>
            <Text style={styles.label}>Semestre</Text>
            <Text style={styles.value}>{session.semestre || '....................................'}</Text>
          </View>
          
          <View style={styles.inlineRow}>
            <Text style={styles.label}>durant la période :</Text>
            <Text style={styles.value}>{session.periode || '.............................'}</Text>
          </View>
          
        </View>

        {/* Tableau coordinateur - CORRIGÉ */}
        <View style={styles.section}>
          <Text>A été effectuée par la participation a la coordination du :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>Nom et Prénom</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>Fonction</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>N° CIN</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>RIB</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>Banque</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>{coordinateur?.name || 'Non renseigné'}</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>{coordinateur?.fonction || 'Coordinateur'}</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>{coordinateur?.cin || ''}</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>{coordinateur?.rib || ''}</Text>
              </View>
              <View style={styles.tableColFive}>
                <Text style={styles.tableCell}>{coordinateur?.banque || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tableau montants coordination - CORRIGÉ */}
        <View style={styles.section}>
          <Text>Et ce selon les informations ci-dessous :</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>Montant Brut</Text>
              </View>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>Retenue</Text>
              </View>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>Montant Net</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>{(fiche.montantBrut ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>{retenue.toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColThree}>
                <Text style={styles.tableCell}>{(fiche.montantNet ?? 0).toFixed(3)} TND</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Montant en toutes lettres</Text>
              </View>
              <View style={styles.tableColTwoThirds}>
                <Text style={styles.tableCell}>{amountToWords(fiche.montantBrut ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.section}><Text>Visa et Cachet du directeur de l'établissement : ................</Text></View>
          <View style={styles.section}><Text>Signature du coordinateur : ................</Text></View>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}

// Fonction pour le règlement - CORRIGÉE
export async function generateReglementPDF(session, fiche, formateurs, coordFiche, coordinateur) {
  const totalFormateursNet = formateurs?.reduce((sum, f) => sum + (f.fiche?.montantNet || 0), 0) || 0;
  const totalFormateursBrut = formateurs?.reduce((sum, f) => sum + (f.fiche?.montantBrut || 0), 0) || 0;
  const totalCoordinationNet = coordFiche?.montantNet || 0;
  const totalCoordinationBrut = coordFiche?.montantBrut || 0;
  const totalGeneral = totalFormateursNet + totalCoordinationNet;
  const totalGeneralBrut = totalFormateursBrut + totalCoordinationBrut;
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderDocumentHeader('MEMOIRE DE REGLEMENT')}

        {/* Informations mémoire */}
        <View style={styles.memoInfo}>
          <Text style={styles.memoNumber}>
            <Text style={styles.label}>N° Mémoire :</Text> {fiche.numMemoire || '...............'}
          </Text>
          <Text style={styles.memoDate}>
            <Text style={styles.label}>Date Mémoire :</Text> {formatDate(fiche.updatedAt) || '...............'}
          </Text>
        </View>

        {/* Section certification */}
        <View style={[styles.section, styles.headerSection]}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Je soussigné(e) Mr (Mme)</Text>
            <Text style={styles.value}>{fiche.nomResponsable || '.............................'}</Text>
            <Text style={styles.label}>Fonction</Text>
            <Text style={styles.value}>.................................</Text>
            <Text style={styles.label}>De</Text>
            <Text style={styles.value}>........................................</Text>
            <Text>certifie que le règlement relatif a :</Text>
          </View>
        </View>

        {/* Informations formation */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Classe</Text>
            <Text style={styles.value}>{session.classe || '.............................'}</Text>
            <Text style={styles.label}>Spécialité</Text>
            <Text style={styles.value}>{session.specialite || '.............................'}</Text>
            <Text style={styles.label}>Promotion</Text>
            <Text style={styles.value}>{session.promotion || '.............................'}</Text>
            <Text style={styles.label}>Niveau</Text>
            <Text style={styles.value}>{session.niveau || '..................................'}</Text>
            <Text style={styles.label}>Semestre</Text>
            <Text style={styles.value}>{session.semestre || '....................................'}</Text>
          </View>
          
          <View style={styles.inlineRow}>
            <Text style={styles.label}>durant la période :</Text>
            <Text style={styles.value}>{session.periode || '.............................'}</Text>
          </View>
          
        </View>

        {/* Détail des formateurs - CORRIGÉ */}
        <View style={styles.section}>
          <Text>Etat de rémunération des enseignants :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Nom et Prénom</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>N° CIN</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Total regr</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Total tutorat</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Total heures</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Montant brut</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Retenues</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Montant net</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>RIB</Text>
              </View>
              <View style={styles.tableColTen}>
                <Text style={styles.tableCell}>Banque</Text>
              </View>
            </View>
            {formateurs?.map((formateur, index) => {
              const brut = formateur.fiche?.montantBrut ?? 0;
              const net = formateur.fiche?.montantNet ?? 0;
              const retenue = brut - net;
              return (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.name || 'Non renseigné'}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.cin || ''}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.fiche?.totalRegroupement || 0}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.fiche?.totalTutorat || 0}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.fiche?.totalHeures || 0}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{brut.toFixed(3)} TND</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{retenue.toFixed(3)} TND</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{net.toFixed(3)} TND</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formatRib(formateur.rib)}</Text>
                  </View>
                  <View style={styles.tableColTen}>
                    <Text style={styles.tableCell}>{formateur.banque || ''}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>TOTAL (brut)</Text>
              </View>
              <View style={styles.tableColTwoThirds}>
                <Text style={styles.tableCell}>{totalFormateursBrut.toFixed(3)} TND</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Détail de la coordination - CORRIGÉ */}
        <View style={styles.section} wrap={false}>
          <Text>Frais de coordination :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Nom et prénom</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>N° CIN</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Montant brut</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Retenues</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Montant net</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Total brut</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>RIB</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>Banque</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{coordinateur?.name || 'Non renseigné'}</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{coordinateur?.cin || ''}</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{(coordFiche?.montantBrut ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{((coordFiche?.montantBrut ?? 0) - (coordFiche?.montantNet ?? 0)).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{(coordFiche?.montantNet ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{(coordFiche?.montantBrut ?? 0).toFixed(3)} TND</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{formatRib(coordinateur?.rib)}</Text>
              </View>
              <View style={styles.tableColEight}>
                <Text style={styles.tableCell}>{coordinateur?.banque || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total général - CORRIGÉ */}
        <View style={styles.section} wrap={false}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Total général brut</Text>
              </View>
              <View style={styles.tableColTwoThirds}>
                <Text style={styles.tableCell}>{totalGeneralBrut.toFixed(3)} TND</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColThree}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Montant total en toutes lettres</Text>
              </View>
              <View style={styles.tableColTwoThirds}>
                <Text style={styles.tableCell}>{amountToWords(totalGeneralBrut)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.section}><Text>Visa et Cachet du directeur de l'établissement : ..............................</Text></View>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}