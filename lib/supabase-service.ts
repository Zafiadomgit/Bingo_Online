
import { dataService } from './data-service'
import type { User, BingoGame, BingoCard } from './data-service'

export type { User, BingoGame, BingoCard }

export class SupabaseService {
    async getCurrentUser(token?: string) {
        return dataService.getCurrentUser(token)
    }

    async getActiveGames() {
        return dataService.getActiveGames()
    }

    async getGame(gameId: string) {
        return dataService.getGame(gameId)
    }

    async getUserCards(gameId: string, userId: string) {
        return dataService.getUserCards(gameId, userId)
    }

    async getGameCardCount(gameId: string) {
        return dataService.getGameCardCount(gameId)
    }

    async purchaseCard(gameId: string, userId: string) {
        return dataService.purchaseCard(gameId, userId)
    }

    async addCredits(userId: string, amount: number) {
        return dataService.addCredits(userId, amount)
    }

    async createUser(email: string, password: string, display_name?: string) {
        return dataService.createUser(email, password, display_name)
    }

    async authenticateUser(email: string, password: string) {
        return dataService.authenticateUser(email, password)
    }

    async createPurchaseRequest(purchaseData: any) {
        return dataService.createPurchaseRequest(purchaseData)
    }

    async getPurchaseRequests() {
        return dataService.getPurchaseRequests()
    }

    async getPurchaseRequestsByEmail(email: string) {
        return dataService.getPurchaseRequestsByEmail(email)
    }

    async updatePurchaseRequestStatus(id: string, status: string) {
        return dataService.updatePurchaseRequestStatus(id, status)
    }
}
