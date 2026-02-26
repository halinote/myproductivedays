import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { DoodleCard, DoodleButton } from '@/components/common';
import { useProjectStore, Project } from '@/stores/useProjectStore';
import { COLORS } from '@/constants';

// Home 화면 — 내 작업실
export default function HomeScreen() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

  // 최근 작업물 카드
  const renderProjectCard = ({ item }: { item: Project }) => (
    <DoodleCard
      bgColor="white"
      onPress={() => {
        setCurrentProject(item);
        router.push('/editor');
      }}
      style={styles.projectCard}
    >
      <View style={styles.cardPreview}>
        <Text style={styles.cardEmoji}>
          {item.mode === 'widget' ? '📱' : '🖼️'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDate}>
        {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
      </Text>
    </DoodleCard>
  );

  // 빈 상태
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>✏️</Text>
      <Text style={styles.emptyTitle}>아직 작업물이 없어요</Text>
      <Text style={styles.emptyDesc}>
        아래 버튼을 눌러{'\n'}첫 번째 배경화면을 만들어보세요!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Pocket</Text>
          <Text style={styles.title}>Atelier ✨</Text>
        </View>
        <DoodleCard
          bgColor="white"
          onPress={() => {}}
          style={styles.settingsBtn}
        >
          <Settings size={24} color={COLORS.textPrimary} />
        </DoodleCard>
      </View>

      {/* 작업물 목록 */}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={EmptyState}
      />

      {/* FAB — 새 배경화면 만들기 */}
      <View style={styles.fabContainer}>
        <DoodleButton
          bgColor={COLORS.accent}
          onPress={() => router.push('/type-select')}
        >
          <Text style={styles.fabText}>+ 새로 만들기</Text>
        </DoodleButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 32,
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  settingsBtn: {
    padding: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectCard: {
    width: '48%',
    padding: 12,
  },
  cardPreview: {
    height: 120,
    backgroundColor: COLORS.editorBg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontFamily: 'Gaegu',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: 'Gaegu',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  fabText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 22,
    color: COLORS.textPrimary,
  },
});
