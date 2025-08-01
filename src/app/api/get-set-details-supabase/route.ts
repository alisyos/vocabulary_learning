import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json({
        success: false,
        message: 'setId parameter is required'
      }, { status: 400 });
    }

    // Get detailed content set data from Supabase
    const contentSetDetails = await db.getContentSetById(setId);

    if (!contentSetDetails) {
      return NextResponse.json({
        success: false,
        message: 'Content set not found'
      }, { status: 404 });
    }

    // Transform Supabase data to match expected format
    const transformedData = {
      contentSet: {
        ...contentSetDetails,
        // 레거시 호환성을 위한 별칭들 추가
        setId: contentSetDetails.id,
        passageTitle: contentSetDetails.title,
        userId: contentSetDetails.user_id,
        division: contentSetDetails.division,
        mainTopic: contentSetDetails.main_topic,
        subTopic: contentSetDetails.sub_topic,
        keywords: contentSetDetails.keywords,
        maintopic: contentSetDetails.main_topic, // 소문자 버전
        subtopic: contentSetDetails.sub_topic,   // 소문자 버전
        keyword: contentSetDetails.keywords,     // 단수 버전
        vocabularyQuestionCount: contentSetDetails.total_vocabulary_questions,
        comprehensiveQuestionCount: contentSetDetails.total_comprehensive_questions,
        paragraphCount: contentSetDetails.total_passages,
        vocabularyWordsCount: contentSetDetails.total_vocabulary_terms,
        createdAt: contentSetDetails.created_at,
        updatedAt: contentSetDetails.updated_at,
        // 지문 길이와 유형 정보 (실제 저장된 값만 표시, 없으면 빈 값)
        passageLength: contentSetDetails.passage_length || '',
        textType: contentSetDetails.text_type || ''
      },
      passage: contentSetDetails.passages?.[0] ? {
        id: contentSetDetails.passages[0].id,
        title: contentSetDetails.passages[0].title,
        paragraphs: [
          contentSetDetails.passages[0].paragraph_1,
          contentSetDetails.passages[0].paragraph_2,
          contentSetDetails.passages[0].paragraph_3,
          contentSetDetails.passages[0].paragraph_4,
          contentSetDetails.passages[0].paragraph_5,
          contentSetDetails.passages[0].paragraph_6,
          contentSetDetails.passages[0].paragraph_7,
          contentSetDetails.passages[0].paragraph_8,
          contentSetDetails.passages[0].paragraph_9,
          contentSetDetails.passages[0].paragraph_10,
        ].filter(p => p !== null && p !== undefined && p !== ''),
        createdAt: contentSetDetails.passages[0].created_at,
      } : null,
      vocabularyTerms: contentSetDetails.vocabulary_terms || [],
      vocabularyQuestions: contentSetDetails.vocabulary_questions?.map(q => ({
        id: q.id,
        term: q.question_text.includes('다음 중') ? '어휘' : q.question_text.split(' ')[0], // Extract term from question
        question: q.question_text,
        options: [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(o => o),
        answer: q.correct_answer,
        explanation: q.explanation
      })) || [],
      comprehensiveQuestions: contentSetDetails.comprehensive_questions?.map(q => ({
        id: q.id,
        questionId: q.id,
        type: q.question_type || '단답형', // 실제 문제 유형 (단답형, 문단별 순서 맞추기 등)
        questionType: q.question_type || '단답형', // 호환성을 위한 별칭
        question: q.question_text,
        questionFormat: q.question_format || (q.option_1 ? '객관식' : '주관식'),
        options: q.question_format === '객관식' || q.option_1 ? 
          [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(o => o) : 
          undefined,
        answer: q.correct_answer,
        correctAnswer: q.correct_answer, // 호환성을 위한 별칭
        explanation: q.explanation,
        isSupplementary: q.is_supplementary || q.difficulty === '보완',
        originalQuestionId: q.original_question_id,
        questionSetNumber: q.question_set_number || 1
      })) || []
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      version: 'supabase',
      message: 'Content set details retrieved successfully from Supabase'
    });

  } catch (error) {
    console.error('Supabase set details error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve content set details from Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}