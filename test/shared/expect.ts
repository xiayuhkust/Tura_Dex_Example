import { expect } from 'chai'
import { waffleChai } from '@ethereum-waffle/chai'
import chai from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'

chai.use(waffleChai)
chai.use(jestSnapshotPlugin())

export { expect }
