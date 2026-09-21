import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseConventionalCommit } from '../../src/lib/conventional-commits'

describe('parseConventionalCommit', () => {
  for (const normalize of [false, true]) {
    describe(normalize ? 'normalized' : 'non-normalized', () => {
      it('parses a simple type', () => {
        const parsed = parseConventionalCommit('feat: add a new button', {
          normalize,
        })
        assert.deepStrictEqual(parsed, {
          rawType: 'feat',
          label: normalize ? 'Feat' : 'feat',
          scope: null,
          leftSideText: '',
          rightSideText: 'add a new button',
        })
      })

      it('parses a type with a scope', () => {
        const parsed = parseConventionalCommit(
          'fix(parser): handle empty input',
          { normalize }
        )
        assert.deepStrictEqual(parsed, {
          rawType: 'fix',
          label: normalize ? 'Fix' : 'fix',
          scope: 'parser',
          leftSideText: '',
          rightSideText: 'handle empty input',
        })
      })

      it('marks breaking changes with a trailing exclamation mark', () => {
        assert.strictEqual(
          parseConventionalCommit('feat!: drop node 16', { normalize })?.label,
          normalize ? 'Feat!' : 'feat!'
        )
        assert.strictEqual(
          parseConventionalCommit('refactor(api)!: rename method', {
            normalize,
          })?.label,
          normalize ? 'Refactor!' : 'refactor!'
        )
      })

      it('maps every recognised type to its label', () => {
        const cases: ReadonlyArray<[string, string]> = [
          ['feat', 'Feat'],
          ['fix', 'Fix'],
          ['fixes', 'Fixes'],
          ['hotfix', 'Hotfix'],
          ['chore', 'Chore'],
          ['revert', 'Revert'],
          ['style', 'Style'],
          ['spelling', 'Spelling'],
          ['docs', 'Docs'],
          ['doc', 'Doc'],
          ['build', 'Build'],
          ['refactor', 'Refactor'],
          ['test', 'Test'],
          ['ci', 'CI'],
          ['perf', 'Perf'],
          ['deps', 'Deps'],
          ['security', 'Security'],
          ['release', 'Release'],
          ['temp', 'Temp'],
          ['wip', 'WIP'],
          ['config', 'Config'],
          ['infra', 'Infra'],
          ['ops', 'Ops'],
          ['ui', 'UI'],
          ['ux', 'UX'],
          ['design', 'Design'],
        ]

        for (const [type, label] of cases) {
          const parsed = parseConventionalCommit(`${type}: do the thing`, {
            normalize,
          })
          assert.strictEqual(parsed?.rawType, type)
          assert.strictEqual(parsed?.label, normalize ? label : type)
        }
      })

      it('tolerates extra whitespace after the colon', () => {
        assert.strictEqual(
          parseConventionalCommit('docs:    update readme', { normalize })
            ?.rightSideText,
          'update readme'
        )
      })

      it('tolerates leading whitespace before the type', () => {
        assert.deepStrictEqual(
          parseConventionalCommit(' fix: cache languages', { normalize }),
          {
            rawType: 'fix',
            label: normalize ? 'Fix' : 'fix',
            scope: null,
            leftSideText: '',
            rightSideText: 'cache languages',
          }
        )
        assert.strictEqual(
          parseConventionalCommit('\tfeat: add thing', { normalize })?.label,
          normalize ? 'Feat' : 'feat'
        )
      })

      it('parses unrecognised types using the raw type as the label', () => {
        assert.deepStrictEqual(
          parseConventionalCommit('note: heads up', { normalize }),
          {
            rawType: 'note',
            label: 'note',
            scope: null,
            leftSideText: '',
            rightSideText: 'heads up',
          }
        )
        assert.deepStrictEqual(
          parseConventionalCommit('abcde: a thing', { normalize }),
          {
            rawType: 'abcde',
            label: 'abcde',
            scope: null,
            leftSideText: '',
            rightSideText: 'a thing',
          }
        )
      })

      it('matches the type case-insensitively, normalising rawType to lower case', () => {
        assert.deepStrictEqual(
          parseConventionalCommit('Feat: capitalized', { normalize }),
          {
            rawType: 'feat',
            label: 'Feat',
            scope: null,
            leftSideText: '',
            rightSideText: 'capitalized',
          }
        )
        assert.deepStrictEqual(
          parseConventionalCommit('FIX(API)!: shouting', { normalize }),
          {
            rawType: 'fix',
            label: normalize ? 'Fix!' : 'FIX!',
            scope: 'API',
            leftSideText: '',
            rightSideText: 'shouting',
          }
        )
        assert.deepStrictEqual(
          parseConventionalCommit('dOcUmEnTaTiOn: sarcasm', { normalize }),
          {
            rawType: 'documentation',
            label: normalize ? 'Documentation' : 'dOcUmEnTaTiOn',
            scope: null,
            leftSideText: '',
            rightSideText: 'sarcasm',
          }
        )
      })

      it('badges the conventional commit nested after a Merge prefix', () => {
        assert.deepStrictEqual(
          parseConventionalCommit(
            'Merge test(abc): isolate the verification flow',
            { normalize }
          ),
          {
            rawType: 'test',
            label: normalize ? 'Test' : 'test',
            scope: 'abc',
            leftSideText: 'Merge ',
            rightSideText: 'isolate the verification flow',
          }
        )
      })

      it('keeps the Revert prefix and opening quote as left side text', () => {
        assert.deepStrictEqual(
          parseConventionalCommit('Revert "feat: a thing"', { normalize }),
          {
            rawType: 'feat',
            label: normalize ? 'Feat' : 'feat',
            scope: null,
            leftSideText: 'Revert "',
            rightSideText: 'a thing"',
          }
        )
      })

      it('badges the conventional commit nested after a quoted Reapply prefix', () => {
        assert.deepStrictEqual(
          parseConventionalCommit(
            'Reapply " fix: don\'t cache empty commerce languages"',
            { normalize }
          ),
          {
            rawType: 'fix',
            label: normalize ? 'Fix' : 'fix',
            scope: null,
            leftSideText: 'Reapply "',
            rightSideText: 'don\'t cache empty commerce languages"',
          }
        )
      })

      it('keeps an autosquash prefix as left side text and badges the nested type', () => {
        assert.deepStrictEqual(
          parseConventionalCommit('fixup! fix(parser): handle empty input', {
            normalize,
          }),
          {
            rawType: 'fix',
            label: normalize ? 'Fix' : 'fix',
            scope: 'parser',
            leftSideText: 'fixup! ',
            rightSideText: 'handle empty input',
          }
        )
        assert.deepStrictEqual(
          parseConventionalCommit('squash! feat(ui): add keyboard shortcut', {
            normalize,
          }),
          {
            rawType: 'feat',
            label: normalize ? 'Feat' : 'feat',
            scope: 'ui',
            leftSideText: 'squash! ',
            rightSideText: 'add keyboard shortcut',
          }
        )
        assert.deepStrictEqual(
          parseConventionalCommit(
            'amend! refactor(list): simplify row rendering',
            { normalize }
          ),
          {
            rawType: 'refactor',
            label: normalize ? 'Refactor' : 'refactor',
            scope: 'list',
            leftSideText: 'amend! ',
            rightSideText: 'simplify row rendering',
          }
        )
      })

      it('keeps chained autosquash prefixes as left side text', () => {
        assert.deepStrictEqual(
          parseConventionalCommit(
            'fixup! squash! fix(parser): handle empty input',
            { normalize }
          ),
          {
            rawType: 'fix',
            label: normalize ? 'Fix' : 'fix',
            scope: 'parser',
            leftSideText: 'fixup! squash! ',
            rightSideText: 'handle empty input',
          }
        )
      })

      it('combines an autosquash prefix with a revert wrapper', () => {
        assert.deepStrictEqual(
          parseConventionalCommit('fixup! Revert "feat: a thing"', {
            normalize,
          }),
          {
            rawType: 'feat',
            label: normalize ? 'Feat' : 'feat',
            scope: null,
            leftSideText: 'fixup! Revert "',
            rightSideText: 'a thing"',
          }
        )
      })

      it('does not badge autosquash commits without a nested type', () => {
        assert.strictEqual(
          parseConventionalCommit('fixup! update readme', { normalize }),
          null
        )
        assert.strictEqual(
          parseConventionalCommit('squash! just a normal commit', {
            normalize,
          }),
          null
        )
      })

      it('does not badge Merge/Revert/Reapply commits without a nested type', () => {
        assert.strictEqual(
          parseConventionalCommit("Merge branch 'main'", { normalize }),
          null
        )
        assert.strictEqual(
          parseConventionalCommit('Revert "an unconventional commit"', {
            normalize,
          }),
          null
        )
      })

      it('returns null for non-conventional summaries', () => {
        assert.strictEqual(
          parseConventionalCommit('just a normal commit', { normalize }),
          null
        )
        assert.strictEqual(parseConventionalCommit('', { normalize }), null)
        assert.strictEqual(
          parseConventionalCommit('feat add button', { normalize }),
          null
        )
      })
    })
  }

  describe('normalizes ')
})
