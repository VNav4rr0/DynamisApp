import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// 1. Importe os tipos de navegação
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // ATENÇÃO: Ajuste o caminho para o seu App.tsx se necessário

// 2. Crie um tipo para a navegação desta tela
type GerenciarInformacoesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GerenciarInformacoesScreen: React.FC = () => {
  // 3. Aplique o tipo ao hook useNavigation
  const navigation = useNavigation<GerenciarInformacoesNavigationProp>();
  const [genero, setGenero] = useState<'homem' | 'mulher'>('homem');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* O botão de voltar agora tem a função goBack() e a navegação está corretamente tipada */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.headerText}>Gerenciar Informações</Text>
      </TouchableOpacity>

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        <TextInput placeholder="Nome completo" placeholderTextColor="#888" style={styles.input} />
        <View style={styles.row}>
          <TextInput placeholder="Sua Idade" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
          <TextInput placeholder="Sua Altura" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
        </View>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'homem' && styles.genderButtonActive]}
            onPress={() => setGenero('homem')}
          >
            {genero === 'homem' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>Homem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'mulher' && styles.genderButtonActive]}
            onPress={() => setGenero('mulher')}
          >
            {genero === 'mulher' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>Mulher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Meta Pessoais</Text>
        <View style={styles.row}>
          <TextInput placeholder="Peso Atual" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
          <View style={styles.arrowContainer}>
            <MaterialIcons name="arrow-forward" size={20} color="#C2185B" />
          </View>
          <TextInput placeholder="Peso Meta" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
        </View>
        <TextInput placeholder="Objetivo" placeholderTextColor="#888" style={styles.input} />
        <TextInput placeholder="Nível de Atividades" placeholderTextColor="#888" style={styles.input} />
      </View>

      {/* Conta */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <TextInput placeholder="E-mail" placeholderTextColor="#888" style={styles.input} />
        <TextInput placeholder="Senha" placeholderTextColor="#888" style={styles.input} secureTextEntry />
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.saveButton}>
        <MaterialIcons name="edit" size={20} color="#000" />
        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton}>
        <MaterialIcons name="delete" size={20} color="red" />
        <Text style={styles.deleteButtonText}>Excluir Conta</Text>
      </TouchableOpacity>

      <Text style={styles.warningText}>Esta ação é permanente e não pode ser desfeita.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    paddingBottom: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  headerText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 10,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  genderButtonActive: {
    backgroundColor: '#2E2E2E',
  },
  genderText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#AEF359',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
  },
  warningText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 13,
  },
});

export default GerenciarInformacoesScreen;