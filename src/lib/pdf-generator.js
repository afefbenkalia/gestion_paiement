// lib/pdf-generator.js
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import writtenNumber from 'written-number';

writtenNumber.defaults.lang = 'fr';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 15,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableColHeader: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontFamily: 'Helvetica-Bold',
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: '#000',
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

// Fonction pour la formation
export async function generateFormationPDF(session, fiche, formateur) {
  const retenue = (fiche.montantNet ?? 0) - (fiche.montantBrut ?? 0);
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>MEMOIRE INDIVIDUELLE : FORMATION</Text>
        
        <View style={styles.section}>
          <Text>N° Mémoire : {fiche.numMemoire || 'NON-ATTRIBUÉ'}</Text>
          <Text>Date Mémoire : {formatDate(fiche.updatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Je soussigné(e) Mr (Mme) {fiche.nomResponsable || 'Le Responsable'} - Fonction : {formateur?.fonction || 'Formateur'}</Text>
          <Text>Classe : {session.classe || ''} - Spécialité : {session.specialite || ''}</Text>
          <Text>Promotion : {session.promotion || ''} - Niveau : {session.niveau || ''} - Semestre : {session.semestre || ''}</Text>
          <Text>Durant la période : {session.periode || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text>A été effectuée par l'enseignant(e) :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Nom et Prénom</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>N° CIN</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>RIB</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Banque</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCell]}>{formateur?.name || 'Non renseigné'}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{formateur?.cin || ''}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{formateur?.rib || ''}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{formateur?.banque || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Total regroupement</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Total tutorat</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Total heures</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Montant Brut</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Retenue</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>Montant Net</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{(fiche.totalRegroupement ?? 0).toString()}</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{(fiche.totalTutorat ?? 0).toString()}</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{(fiche.totalHeures ?? 0).toString()}</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{(fiche.montantBrut ?? 0).toFixed(3)} TND</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{retenue.toFixed(3)} TND</Text>
              <Text style={[styles.tableColHeader, styles.tableCell]}>{(fiche.montantNet ?? 0).toFixed(3)} TND</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Montant en toutes lettres : {amountToWords(fiche.montantNet ?? 0)}</Text>
        </View>

        <View style={styles.signatureSection}>
          <Text>Visa et Cachet du directeur de l'établissement : ________________________________</Text>
          <Text>Signature de l'enseignant(e)/formateur : ________________________________</Text>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}

// Fonction pour la coordination
export async function generateCoordinationPDF(session, fiche, coordinateur) {
  const retenue = (fiche.montantNet ?? 0) - (fiche.montantBrut ?? 0);
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>MEMOIRE INDIVIDUELLE : COORDINATION</Text>
        
        <View style={styles.section}>
          <Text>N° Mémoire : {fiche.numMemoire || 'NON-ATTRIBUÉ'}</Text>
          <Text>Date Mémoire : {formatDate(fiche.updatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Je soussigné(e) Mr (Mme) {fiche.nomResponsable || 'Le Responsable'} - Fonction : Responsable</Text>
          <Text>Classe : {session.classe || ''} - Spécialité : {session.specialite || ''}</Text>
          <Text>Promotion : {session.promotion || ''} - Niveau : {session.niveau || ''} - Semestre : {session.semestre || ''}</Text>
          <Text>Durant la période : {session.periode || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text>A été effectuée par le coordinateur :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Nom et Prénom</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>N° CIN</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>RIB</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Banque</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCell]}>{coordinateur?.name || 'Non renseigné'}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{coordinateur?.cin || ''}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{coordinateur?.rib || ''}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{coordinateur?.banque || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Description</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Montant Brut</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Retenue</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Montant Net</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCell]}>Coordination de session</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{(fiche.montantBrut ?? 0).toFixed(3)} TND</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{retenue.toFixed(3)} TND</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{(fiche.montantNet ?? 0).toFixed(3)} TND</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Montant en toutes lettres : {amountToWords(fiche.montantNet ?? 0)}</Text>
        </View>

        <View style={styles.signatureSection}>
          <Text>Visa et Cachet du directeur de l'établissement : ________________________________</Text>
          <Text>Signature du coordinateur : ________________________________</Text>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}

// Fonction pour le règlement
export async function generateReglementPDF(session, fiche, formateurs, coordFiche, coordinateur) {
  const totalFormateursNet = formateurs?.reduce((sum, f) => sum + (f.fiche?.montantNet || 0), 0) || 0;
  const totalCoordinationNet = coordFiche?.montantNet || 0;
  const totalGeneral = totalFormateursNet + totalCoordinationNet;
  
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>MEMOIRE DE REGLEMENT</Text>
        
        <View style={styles.section}>
          <Text>N° Mémoire : {fiche.numMemoire || 'NON-ATTRIBUÉ'}</Text>
          <Text>Date Mémoire : {formatDate(fiche.updatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text>Session : {session.titre || ''}</Text>
          <Text>Classe : {session.classe || ''} - Spécialité : {session.specialite || ''}</Text>
          <Text>Promotion : {session.promotion || ''} - Période : {session.periode || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text>Détail des formateurs :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Formateur</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Heures</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Montant Net</Text>
            </View>
            {formateurs?.map((formateur, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableCol, styles.tableCell]}>{formateur.name}</Text>
                <Text style={[styles.tableCol, styles.tableCell]}>{formateur.fiche?.totalHeures || 0}</Text>
                <Text style={[styles.tableCol, styles.tableCell]}>{(formateur.fiche?.montantNet || 0).toFixed(3)} TND</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text>Détail de la coordination :</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Coordinateur</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Description</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Montant Net</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCell]}>{coordinateur?.name || 'Non renseigné'}</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Coordination</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{totalCoordinationNet.toFixed(3)} TND</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.tableCell]}>Total Formateurs</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Total Coordination</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>Total Général</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.tableCell]}>{totalFormateursNet.toFixed(3)} TND</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{totalCoordinationNet.toFixed(3)} TND</Text>
              <Text style={[styles.tableCol, styles.tableCell]}>{totalGeneral.toFixed(3)} TND</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Montant total en toutes lettres : {amountToWords(totalGeneral)}</Text>
        </View>

        <View style={styles.signatureSection}>
          <Text>Visa et Cachet du directeur de l'établissement : ________________________________</Text>
          <Text>Signature du responsable : ________________________________</Text>
        </View>
      </Page>
    </Document>
  );

  const pdfStream = await pdf(<MyDocument />).toBuffer();
  return pdfStream;
}