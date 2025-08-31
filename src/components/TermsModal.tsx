import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface TermsModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isVisible, onAccept, onDecline }) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{t('terms.title')}</Text>

          <View style={styles.contentScrollView}>
            <ScrollView>
              <Text style={styles.paragraph}>{t('terms.disclaimer')}</Text>
              <Text style={styles.subTitle}>{t('terms.section1Title')}</Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>1. {t('terms.section1Text1Heading')}</Text> {t('terms.section1Text1')}
              </Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>2. {t('terms.section1Text2Heading')}</Text> {t('terms.section1Text2')}
              </Text>
              <Text style={styles.paragraph}>{t('terms.section1Text3')}</Text>
              <Text style={styles.disclaimer}>
                <Text style={styles.bold}>{t('terms.importantNote')}</Text> {t('terms.professionalAdvice')}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
              <Text style={styles.declineButtonText}>{t('terms.declineButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>{t('terms.acceptButton')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1C1C1E',
    borderRadius: 48,
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.055,
    fontFamily: 'Fustat-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  contentScrollView: {
    maxHeight: screenWidth * 0.7,
    marginBottom: 24,
  },
  subTitle: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontFamily: 'Fustat-Bold',
    marginTop: 10,
    marginBottom: 5,
  },
  paragraph: {
    color: '#CCCCCC',
    fontSize: screenWidth * 0.038,
    fontFamily: 'Fustat-Regular',
    lineHeight: screenWidth * 0.055,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Fustat-Bold',
    color: '#FFFFFF',
  },
  disclaimer: {
    color: '#FFD700',
    fontSize: screenWidth * 0.038,
    fontFamily: 'Fustat-Regular',
    lineHeight: screenWidth * 0.055,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  declineButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  declineButtonText: {
    color: '#8A8A8E',
    fontSize: screenWidth * 0.04,
    fontFamily: 'Fustat-Regular',
  },
  acceptButton: {
    backgroundColor: '#82CD32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  acceptButtonText: {
    color: '#0D0D0D',
    fontSize: screenWidth * 0.04,
    fontFamily: 'Fustat-Bold',
  },
});

export default TermsModal;