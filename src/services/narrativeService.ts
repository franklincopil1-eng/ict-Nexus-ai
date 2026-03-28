
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { RegimeContext } from './regimeService';
import { HTFContext, SMTContext } from './marketContextService';

export interface MarketNarrativeEntry {
  id?: string;
  timestamp: any;
  regime: RegimeContext;
  htf: HTFContext;
  smt: SMTContext;
  summary: string;
  evolution_note: string;
}

export class NarrativeService {
  /**
   * Saves a snapshot of the current market state to the narrative log.
   */
  static async recordState(regime: RegimeContext, htf: HTFContext, smt: SMTContext): Promise<void> {
    try {
      const summary = `Regime: ${regime.regime} (${regime.bias}) | HTF: ${htf.bias} | SMT: ${smt.type}`;
      
      // Get previous state to determine evolution
      const history = await this.getRecentNarrative(1);
      let evolution_note = "Initial state recorded.";
      
      if (history.length > 0) {
        const prev = history[0];
        if (prev.regime.regime !== regime.regime) {
          evolution_note = `Market shifted from ${prev.regime.regime} to ${regime.regime}.`;
        } else if (prev.regime.bias !== regime.bias) {
          evolution_note = `Bias shifted from ${prev.regime.bias} to ${regime.bias} within ${regime.regime}.`;
        } else {
          evolution_note = `Market remains in ${regime.regime} with ${regime.bias} bias.`;
        }
      }

      await addDoc(collection(db, 'market_narrative'), {
        regime,
        htf,
        smt,
        summary,
        evolution_note,
        timestamp: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'market_narrative'));
      
      console.log(`[NARRATIVE] State recorded: ${summary}`);
    } catch (error) {
      // Error already handled or re-thrown
      throw error;
    }
  }

  /**
   * Retrieves the recent market evolution narrative.
   */
  static async getRecentNarrative(count: number = 5): Promise<MarketNarrativeEntry[]> {
    try {
      const q = query(
        collection(db, 'market_narrative'),
        orderBy('timestamp', 'desc'),
        limit(count)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketNarrativeEntry[];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'market_narrative');
      return [];
    }
  }

  /**
   * Formats the narrative history for AI consumption.
   */
  static formatForAI(history: MarketNarrativeEntry[]): string {
    if (history.length === 0) return "No historical narrative available.";
    
    return history.reverse().map((entry, i) => {
      const date = entry.timestamp instanceof Timestamp ? entry.timestamp.toDate().toLocaleTimeString() : 'Recent';
      return `[${date}] ${entry.summary}. Note: ${entry.evolution_note}`;
    }).join('\n');
  }
}
