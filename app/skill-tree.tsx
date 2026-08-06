import React, { useMemo } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useVocabStore, GUEST_ID, CATEGORY_META } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { buildSkillUnits, getUnitStatus, getLessonStatus, getRouteForLesson, NodeStatus } from '../src/data/skillTree';
import { ScreenHeader } from '../src/components/ui';
import UnitHeader from '../src/components/skillTree/UnitHeader';
import LessonNode from '../src/components/skillTree/LessonNode';
import SkillTreePath, { TreePoint } from '../src/components/skillTree/SkillTreePath';
import { colors } from '../src/theme';

const NODE_SPACING = 110;
const ZIGZAG_OFFSET = 70;

function xOffsetForIndex(index: number): number {
  // 0, +offset, 0, -offset, repeat
  const cycle = index % 4;
  if (cycle === 1) return ZIGZAG_OFFSET;
  if (cycle === 3) return -ZIGZAG_OFFSET;
  return 0;
}

const SkillTree = () => {
  const router = useRouter();
  const { width: screenWidth } = Dimensions.get('window');
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const learnedByUser = useVocabStore(s => s.learnedByUser);
  const learningGoal = useVocabStore(s => s.learningGoal);
  const learningLevel = useVocabStore(s => s.learningLevel);
  const learnedIds = learnedByUser[uid] || [];

  const units = useMemo(() => buildSkillUnits(learningGoal, learningLevel), [learningGoal, learningLevel]);

  const centerX = screenWidth / 2;

  // Find the first lesson that is 'unlocked' (not completed) across the whole tree — pulses.
  const nextLessonKey = useMemo(() => {
    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const unit = units[uIdx];
      const unitStatus = getUnitStatus(units, uIdx, learnedIds);
      for (let lIdx = 0; lIdx < unit.lessons.length; lIdx++) {
        const status = getLessonStatus(unit, lIdx, learnedIds, unitStatus);
        if (status === 'unlocked') return `${unit.category}-${lIdx}`;
      }
    }
    return null;
  }, [units, learnedIds]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Skill Path" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {units.map((unit, uIdx) => {
          const unitStatus: NodeStatus = getUnitStatus(units, uIdx, learnedIds);
          const meta = CATEGORY_META[unit.category];
          const total = unit.lessons.reduce((sum, l) => sum + l.wordIds.length, 0);
          const learned = unit.lessons
            .flatMap(l => l.wordIds)
            .filter(id => learnedIds.includes(id)).length;

          const containerHeight = unit.lessons.length * NODE_SPACING + NODE_SPACING / 2;
          const points: TreePoint[] = unit.lessons.map((_, lIdx) => ({
            x: centerX + xOffsetForIndex(lIdx),
            y: NODE_SPACING / 2 + lIdx * NODE_SPACING,
          }));

          return (
            <View key={unit.category}>
              <UnitHeader category={unit.category} status={unitStatus} learned={learned} total={total} />
              <View style={{ height: containerHeight, position: 'relative' }}>
                <SkillTreePath
                  points={points}
                  width={screenWidth}
                  height={containerHeight}
                  color={unitStatus === 'locked' ? colors.border : meta.color + '55'}
                />
                {unit.lessons.map((lesson, lIdx) => {
                  const status = getLessonStatus(unit, lIdx, learnedIds, unitStatus);
                  const key = `${unit.category}-${lIdx}`;
                  return (
                    <LessonNode
                      key={key}
                      x={points[lIdx].x}
                      y={points[lIdx].y}
                      label={lIdx + 1}
                      status={status}
                      color={meta.color}
                      isNext={key === nextLessonKey}
                      onPress={() => {
                        const route = getRouteForLesson(lesson);
                        router.push({ pathname: route.pathname, params: route.params });
                      }}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SkillTree;
