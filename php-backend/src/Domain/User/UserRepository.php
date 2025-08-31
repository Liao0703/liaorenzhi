<?php
declare(strict_types=1);

namespace App\Domain\User;

interface UserRepository
{
    /**
     * 查找所有用户
     */
    public function findAll(): array;

    /**
     * 根据ID查找用户
     */
    public function findById(int $id): ?User;

    /**
     * 根据用户名查找用户
     */
    public function findByUsername(string $username): ?User;

    /**
     * 创建用户
     */
    public function create(User $user): User;

    /**
     * 更新用户
     */
    public function update(int $id, array $data): ?User;

    /**
     * 删除用户
     */
    public function delete(int $id): bool;

    /**
     * 检查用户名是否存在
     */
    public function usernameExists(string $username): bool;

    /**
     * 根据角色查找用户
     */
    public function findByRole(string $role): array;
}




