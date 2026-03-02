import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { UpdateUserDto } from "../dtos/UserDtos";
import { NotFoundException } from "../../../../core/domain/exceptions/NotFoundException";
import { User } from "../../domain/entities/User";

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, dto: UpdateUserDto): Promise<void> {
    console.log(`[START] - Updating user with id: ${id}`);
    const user = await this.userRepository.findById(id);

    if (!user) throw new NotFoundException("User", id);

    await this.userRepository.update(id, dto as Partial<User>);

    console.log(`[END] User with ${user.id} updated`);
  }
}
