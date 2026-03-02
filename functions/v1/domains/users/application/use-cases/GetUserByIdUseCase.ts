import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { User } from "../../domain/entities/User";
import { NotFoundException } from "../../../../core/domain/exceptions/NotFoundException";

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User> {
    console.log(`[START] - Getting user with id: ${id}`);
    const user = await this.userRepository.findById(id);

    if (!user) throw new NotFoundException("User", id);

    console.log(`[END] User with ${user.id} found`);

    return user;
  }
}
